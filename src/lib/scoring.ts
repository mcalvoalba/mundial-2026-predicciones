import type { Prediction, Match, Round } from './types'

function roundMultiplier(round: Round): number {
  switch (round) {
    case 'R16': return 1.25
    case 'QF': return 1.5
    case 'SF': return 1.75
    case '3RD': return 1.75
    case 'FINAL': return 2
    default: return 1
  }
}

export function calculatePoints(pred: Prediction, match: Match): number {
  if (!match.result_locked || match.winner_team === null) return 0

  const multiplier = roundMultiplier(match.round)

  // ¿Acertó el equipo ganador?
  if (pred.predicted_winner !== match.winner_team) return 0

  // ¿Acertó el resultado exacto en 90min?
  const exact90 =
    match.home_goals_90 === pred.predicted_home_goals_90 &&
    match.away_goals_90 === pred.predicted_away_goals_90

  if (!exact90) return 3 * multiplier

  let points = 5

  // Bono prórroga: +1 si ET exacto, +0.5 si predijo ET y ocurrió pero no exacto
  if (match.went_to_et && pred.predicted_went_to_et) {
    const exactET =
      match.home_goals_et !== null &&
      match.away_goals_et !== null &&
      match.home_goals_et === pred.predicted_home_goals_et &&
      match.away_goals_et === pred.predicted_away_goals_et
    points += exactET ? 1 : 0.5
  }

  // +2: acertó el ganador en penaltis
  if (match.went_to_pens && pred.predicted_went_to_pens && match.pen_winner) {
    const actualPenWinner =
      match.pen_winner === 'home' ? match.home_team : match.away_team
    const predPenWinner =
      pred.predicted_pen_winner === 'home'
        ? pred.predicted_home
        : pred.predicted_away
    if (actualPenWinner === predPenWinner) {
      points += 2
    }
  }

  return points * multiplier
}

export function derivePredictedWinner(draft: {
  predicted_home: string
  predicted_away: string
  predicted_home_goals_90: number | ''
  predicted_away_goals_90: number | ''
  predicted_went_to_et: boolean
  predicted_home_goals_et: number | ''
  predicted_away_goals_et: number | ''
  predicted_went_to_pens: boolean
  predicted_pen_winner: 'home' | 'away' | null
}): string {
  const h90 = Number(draft.predicted_home_goals_90)
  const a90 = Number(draft.predicted_away_goals_90)

  if (h90 > a90) return draft.predicted_home
  if (a90 > h90) return draft.predicted_away

  // Empate a 90min → prórroga
  if (draft.predicted_went_to_et) {
    const het = Number(draft.predicted_home_goals_et)
    const aet = Number(draft.predicted_away_goals_et)
    if (het > aet) return draft.predicted_home
    if (aet > het) return draft.predicted_away

    // Empate en prórroga → penaltis
    if (draft.predicted_went_to_pens && draft.predicted_pen_winner) {
      return draft.predicted_pen_winner === 'home'
        ? draft.predicted_home
        : draft.predicted_away
    }
  }

  return ''
}
