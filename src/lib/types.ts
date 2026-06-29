export type Round = 'R32' | 'R16' | 'QF' | 'SF' | '3RD' | 'FINAL'

export interface Profile {
  id: string
  email: string
  display_name: string
  is_admin: boolean
  created_at: string
}

export interface Match {
  id: number
  round: Round
  match_number: number
  home_team: string | null
  away_team: string | null
  home_seed: string | null
  away_seed: string | null
  match_date: string | null
  venue: string | null

  // Resultados
  home_goals_90: number | null
  away_goals_90: number | null
  went_to_et: boolean
  home_goals_et: number | null
  away_goals_et: number | null
  went_to_pens: boolean
  pen_winner: 'home' | 'away' | null
  winner_team: string | null
  result_locked: boolean

  // Árbol
  next_match_id: number | null
  next_match_slot: 'home' | 'away' | null
  loser_next_match_id: number | null

  created_at: string
  updated_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: number

  predicted_home: string
  predicted_away: string
  predicted_home_goals_90: number
  predicted_away_goals_90: number
  predicted_went_to_et: boolean
  predicted_home_goals_et: number | null
  predicted_away_goals_et: number | null
  predicted_went_to_pens: boolean
  predicted_pen_winner: 'home' | 'away' | null
  predicted_winner: string

  points_earned: number | null
  created_at: string
  updated_at: string
}

export interface DraftPrediction {
  match_id: number
  predicted_home: string
  predicted_away: string
  predicted_home_goals_90: number | ''
  predicted_away_goals_90: number | ''
  predicted_went_to_et: boolean
  predicted_home_goals_et: number | ''
  predicted_away_goals_et: number | ''
  predicted_went_to_pens: boolean
  predicted_pen_winner: 'home' | 'away' | null
  predicted_winner: string
}

export interface BracketSubmission {
  user_id: string
  submitted_at: string | null
  is_locked: boolean
  created_at: string
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  created_at: string
  total_points: number
  matches_scored: number
  perfect_et_pens: number
  perfect_pens: number
  exact_et: number
  exact_scores: number
  correct_winners: number
  wrong_picks: number
}

export const ROUND_LABELS: Record<Round, string> = {
  R32: 'Dieciseisavos',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semifinales',
  '3RD': 'Tercer puesto',
  FINAL: 'Final',
}

export const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']
