# Porra Mundial 2026 — Guía de Configuración

## Pasos para tener la app funcionando HOY

---

## 1. Crear proyecto en Supabase (5 min)

1. Ve a [supabase.com](https://supabase.com) → "New project"
2. Nombre: `porra-mundial`, elige una región cercana (Europe West)
3. Espera ~2 min a que se cree
4. Ve a **Settings → API** y copia:
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public key**: `eyJ...`

---

## 2. Ejecutar el esquema SQL en Supabase (2 min)

1. En Supabase, ve a **SQL Editor**
2. Copia todo el contenido de `supabase/migrations/001_schema.sql`
3. Pégalo en el editor y haz clic en **Run**
4. Verifica que no hay errores

---

## 3. Habilitar Realtime (para el leaderboard en vivo)

1. En Supabase, ve a **Database → Replication**
2. Activa las tablas: `matches` y `predictions`

---

## 4. Crear archivo .env.local (1 min)

Crea el archivo `.env.local` en la raíz del proyecto (junto a `package.json`):

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu_clave_publica

# Fecha/hora del primer partido en UTC (para cerrar las predicciones)
# Ejemplo: si el partido empieza a las 16:00 España (UTC+2 en verano), son las 14:00 UTC
NEXT_PUBLIC_DEADLINE_ISO=2026-06-28T14:00:00Z
```

---

## 5. Desplegar en Vercel (5 min)

### Opción A: Desde GitHub (recomendado)
1. Sube el proyecto a un repositorio GitHub privado
2. Ve a [vercel.com](https://vercel.com) → "New Project"
3. Importa el repositorio
4. En "Environment Variables", añade las 3 variables de `.env.local`
5. Deploy → Vercel te da una URL pública (ej: `porra-mundial-xxx.vercel.app`)

### Opción B: Con Vercel CLI
```bash
npm i -g vercel
vercel
# Sigue las instrucciones y añade las env vars cuando te las pida
```

---

## 6. Configurar el cuadro de dieciseisavos (URGENTE)

Una vez desplegada la app:

1. Entra como admin con tu cuenta (`marcoscalvohovart@gmail.com`)
2. Ve al panel admin (icono de escudo en la barra superior)
3. Para cada uno de los 16 partidos de dieciseisavos:
   - Haz clic en el partido
   - Introduce los nombres de los dos equipos (ej: "España", "Marruecos")
   - Pulsa **"Guardar equipos (sin resultado aún)"**
4. Verifica que el cuadro muestra los 32 equipos correctamente

> ⚠️ **Importante**: Los partidos de dieciseisavos tienen los seeds del cuadro 2026 (1A, 2B, etc.) como placeholder. Debes actualizar con los nombres reales según el cuadro oficial de la FIFA.

---

## 7. Compartir el enlace

Comparte la URL de Vercel con tus amigos. Tienen que:
1. Registrarse con email y contraseña
2. Rellenar el cuadro completo (32 partidos)
3. Enviar antes del primer partido

---

## 8. Introducir resultados (a medida que se jueguen)

Después de cada partido:
1. Panel admin → clic en el partido jugado
2. Introduce el resultado (90min, prórroga si la hubo, penaltis si los hubo)
3. Pulsa **"Guardar resultado y calcular puntos"**
4. Los puntos se calculan automáticamente para todos los participantes

---

## Sistema de puntuación (recordatorio)

| Puntos | Condición |
|--------|-----------|
| **0** | Ganador incorrecto |
| **3** | Ganador correcto (no resultado exacto) |
| **5** | Resultado exacto en 90min |
| **6** | +resultado exacto en 120min (si hubo prórroga) |
| **7** | +ganador correcto en penaltis |
| **8** | +exacto en 120min + ganador en penaltis |

---

## Desarrollo local (opcional)

```bash
# Instalar dependencias
npm install

# Crear .env.local con tus credenciales de Supabase

# Ejecutar en modo desarrollo
npm run dev

# Abrir http://localhost:3000
```

---

## ¿Problemas?

- **El leaderboard no se actualiza en tiempo real**: Verifica que Realtime está activado en Supabase para las tablas `matches` y `predictions`
- **Error 401 al guardar predicciones**: Verifica las RLS policies en Supabase (deben estar como en el SQL)
- **El admin no me deja entrar**: Verifica que `is_admin = TRUE` en la tabla `profiles` para tu email
