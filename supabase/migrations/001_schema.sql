-- =============================================
-- PORRA MUNDIAL 2026 - Schema completo
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. PROFILES (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NEW.email = 'marcoscalvohovart@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. MATCHES (árbol del cuadro eliminatorio)
CREATE TABLE IF NOT EXISTS matches (
  id                    SERIAL PRIMARY KEY,
  round                 TEXT NOT NULL CHECK (round IN ('R32','R16','QF','SF','3RD','FINAL')),
  match_number          INTEGER NOT NULL UNIQUE,
  home_team             TEXT,
  away_team             TEXT,
  home_seed             TEXT,
  away_seed             TEXT,
  match_date            TIMESTAMPTZ,
  venue                 TEXT,

  -- Resultados (introducidos por admin)
  home_goals_90         INTEGER,
  away_goals_90         INTEGER,
  went_to_et            BOOLEAN NOT NULL DEFAULT FALSE,
  home_goals_et         INTEGER,
  away_goals_et         INTEGER,
  went_to_pens          BOOLEAN NOT NULL DEFAULT FALSE,
  pen_winner            TEXT,   -- 'home' | 'away'
  winner_team           TEXT,
  result_locked         BOOLEAN NOT NULL DEFAULT FALSE,

  -- Árbol: a qué partido va el ganador
  next_match_id         INTEGER REFERENCES matches(id),
  next_match_slot       TEXT CHECK (next_match_slot IN ('home','away')),
  -- Solo para Semis: a qué partido va el perdedor (3er puesto)
  loser_next_match_id   INTEGER REFERENCES matches(id),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BRACKET_SUBMISSIONS (estado del envío de porra por usuario)
CREATE TABLE IF NOT EXISTS bracket_submissions (
  user_id       UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at  TIMESTAMPTZ,
  is_locked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PREDICTIONS (predicciones por usuario y partido)
CREATE TABLE IF NOT EXISTS predictions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id                  INTEGER NOT NULL REFERENCES matches(id),

  predicted_home            TEXT NOT NULL,
  predicted_away            TEXT NOT NULL,
  predicted_home_goals_90   INTEGER NOT NULL,
  predicted_away_goals_90   INTEGER NOT NULL,
  predicted_went_to_et      BOOLEAN NOT NULL DEFAULT FALSE,
  predicted_home_goals_et   INTEGER,
  predicted_away_goals_et   INTEGER,
  predicted_went_to_pens    BOOLEAN NOT NULL DEFAULT FALSE,
  predicted_pen_winner      TEXT,   -- 'home' | 'away'
  predicted_winner          TEXT NOT NULL,

  points_earned             INTEGER,   -- NULL hasta que el partido tenga resultado

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, match_id)
);

-- 5. RLS POLICIES
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions         ENABLE ROW LEVEL SECURITY;

-- Profiles: todos pueden leer, cada uno actualiza el suyo
CREATE POLICY "profiles_read_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Matches: todos leen, solo admin escribe
CREATE POLICY "matches_read_all"    ON matches FOR SELECT USING (true);
CREATE POLICY "matches_admin_write" ON matches FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Bracket submissions: todos leen, cada uno gestiona el suyo
CREATE POLICY "submissions_read_all"  ON bracket_submissions FOR SELECT USING (true);
CREATE POLICY "submissions_own_write" ON bracket_submissions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Predictions: todos leen (leaderboard), cada uno escribe las suyas
CREATE POLICY "predictions_read_all"   ON predictions FOR SELECT USING (true);
CREATE POLICY "predictions_own_insert" ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predictions_own_update" ON predictions FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "predictions_own_delete" ON predictions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. LEADERBOARD VIEW
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  pr.id AS user_id,
  pr.display_name,
  pr.created_at,
  COALESCE(SUM(p.points_earned), 0)                                         AS total_points,
  COUNT(p.id) FILTER (WHERE p.points_earned IS NOT NULL)                    AS matches_scored,
  COUNT(p.id) FILTER (WHERE p.points_earned = 8)                            AS perfect_et_pens,
  COUNT(p.id) FILTER (WHERE p.points_earned = 7)                            AS perfect_pens,
  COUNT(p.id) FILTER (WHERE p.points_earned = 6)                            AS exact_et,
  COUNT(p.id) FILTER (WHERE p.points_earned = 5)                            AS exact_scores,
  COUNT(p.id) FILTER (WHERE p.points_earned = 3)                            AS correct_winners,
  COUNT(p.id) FILTER (WHERE p.points_earned = 0)                            AS wrong_picks
FROM profiles pr
LEFT JOIN predictions p ON p.user_id = pr.id
GROUP BY pr.id, pr.display_name, pr.created_at
ORDER BY total_points DESC, pr.created_at ASC;

-- 7. SEED: Estructura del cuadro (32 partidos con wiring)
-- R32 (partidos 1-16), R16 (17-24), QF (25-28), SF (29-30), 3RD (31), FINAL (32)
-- Las next_match_id se insertan después porque las filas ya deben existir

INSERT INTO matches (match_number, round, home_seed, away_seed) VALUES
  -- R32
  (1,  'R32', '1A', '2B'),
  (2,  'R32', '1B', '2A'),
  (3,  'R32', '1C', '2D'),
  (4,  'R32', '1D', '2C'),
  (5,  'R32', '1E', '2F'),
  (6,  'R32', '1F', '2E'),
  (7,  'R32', '1G', '2H'),
  (8,  'R32', '1H', '2G'),
  (9,  'R32', '1I', '2J'),
  (10, 'R32', '1J', '2I'),
  (11, 'R32', '1K', '2L'),
  (12, 'R32', '1L', '2K'),
  (13, 'R32', '3X', '3Y'),
  (14, 'R32', '3X', '3Y'),
  (15, 'R32', '3X', '3Y'),
  (16, 'R32', '3X', '3Y'),
  -- R16
  (17, 'R16', NULL, NULL),
  (18, 'R16', NULL, NULL),
  (19, 'R16', NULL, NULL),
  (20, 'R16', NULL, NULL),
  (21, 'R16', NULL, NULL),
  (22, 'R16', NULL, NULL),
  (23, 'R16', NULL, NULL),
  (24, 'R16', NULL, NULL),
  -- QF
  (25, 'QF',  NULL, NULL),
  (26, 'QF',  NULL, NULL),
  (27, 'QF',  NULL, NULL),
  (28, 'QF',  NULL, NULL),
  -- SF
  (29, 'SF',  NULL, NULL),
  (30, 'SF',  NULL, NULL),
  -- 3RD place
  (31, '3RD', NULL, NULL),
  -- FINAL
  (32, 'FINAL', NULL, NULL);

-- Wiring del árbol (actualizar next_match_id y next_match_slot)
-- R32 → R16
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 17), next_match_slot = 'home' WHERE match_number = 1;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 17), next_match_slot = 'away' WHERE match_number = 2;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 18), next_match_slot = 'home' WHERE match_number = 3;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 18), next_match_slot = 'away' WHERE match_number = 4;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 19), next_match_slot = 'home' WHERE match_number = 5;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 19), next_match_slot = 'away' WHERE match_number = 6;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 20), next_match_slot = 'home' WHERE match_number = 7;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 20), next_match_slot = 'away' WHERE match_number = 8;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 21), next_match_slot = 'home' WHERE match_number = 9;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 21), next_match_slot = 'away' WHERE match_number = 10;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 22), next_match_slot = 'home' WHERE match_number = 11;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 22), next_match_slot = 'away' WHERE match_number = 12;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 23), next_match_slot = 'home' WHERE match_number = 13;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 23), next_match_slot = 'away' WHERE match_number = 14;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 24), next_match_slot = 'home' WHERE match_number = 15;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 24), next_match_slot = 'away' WHERE match_number = 16;
-- R16 → QF
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 25), next_match_slot = 'home' WHERE match_number = 17;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 25), next_match_slot = 'away' WHERE match_number = 18;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 26), next_match_slot = 'home' WHERE match_number = 19;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 26), next_match_slot = 'away' WHERE match_number = 20;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 27), next_match_slot = 'home' WHERE match_number = 21;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 27), next_match_slot = 'away' WHERE match_number = 22;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 28), next_match_slot = 'home' WHERE match_number = 23;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 28), next_match_slot = 'away' WHERE match_number = 24;
-- QF → SF
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 29), next_match_slot = 'home' WHERE match_number = 25;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 29), next_match_slot = 'away' WHERE match_number = 26;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 30), next_match_slot = 'home' WHERE match_number = 27;
UPDATE matches SET next_match_id = (SELECT id FROM matches WHERE match_number = 30), next_match_slot = 'away' WHERE match_number = 28;
-- SF → Final y 3er puesto
UPDATE matches SET
  next_match_id = (SELECT id FROM matches WHERE match_number = 32), next_match_slot = 'home',
  loser_next_match_id = (SELECT id FROM matches WHERE match_number = 31)
WHERE match_number = 29;
UPDATE matches SET
  next_match_id = (SELECT id FROM matches WHERE match_number = 32), next_match_slot = 'away',
  loser_next_match_id = (SELECT id FROM matches WHERE match_number = 31)
WHERE match_number = 30;

-- 8. PERMISOS PARA ROLES authenticated Y anon
-- Sin esto, los usuarios autenticados reciben "permission denied for table X"
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 9. HABILITAR REALTIME para las tablas que necesitan actualizaciones en vivo
-- (Hacer esto en el Dashboard de Supabase: Database → Replication → añadir matches y predictions)
