import type { Match, DraftPrediction, Round } from './types'
import { derivePredictedWinner } from './scoring'

export const STORAGE_KEY_PREFIX = 'porra-draft-'

export function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`
}

export function saveDraftToStorage(userId: string, draft: Map<number, DraftPrediction>) {
  try {
    const obj = Object.fromEntries(draft)
    localStorage.setItem(getStorageKey(userId), JSON.stringify(obj))
  } catch {}
}

export function loadDraftFromStorage(userId: string): Map<number, DraftPrediction> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return new Map()
    return new Map(Object.entries(JSON.parse(raw)).map(([k, v]) => [Number(k), v as DraftPrediction]))
  } catch {
    return new Map()
  }
}

export function clearDraftFromStorage(userId: string) {
  try {
    localStorage.removeItem(getStorageKey(userId))
  } catch {}
}

export function predictionsToMap(predictions: { match_id: number; predicted_home: string; predicted_away: string; predicted_home_goals_90: number; predicted_away_goals_90: number; predicted_went_to_et: boolean; predicted_home_goals_et: number | null; predicted_away_goals_et: number | null; predicted_went_to_pens: boolean; predicted_pen_winner: 'home' | 'away' | null; predicted_winner: string }[]): Map<number, DraftPrediction> {
  const map = new Map<number, DraftPrediction>()
  for (const p of predictions) {
    map.set(p.match_id, {
      match_id: p.match_id,
      predicted_home: p.predicted_home,
      predicted_away: p.predicted_away,
      predicted_home_goals_90: p.predicted_home_goals_90,
      predicted_away_goals_90: p.predicted_away_goals_90,
      predicted_went_to_et: p.predicted_went_to_et,
      predicted_home_goals_et: p.predicted_home_goals_et ?? '',
      predicted_away_goals_et: p.predicted_away_goals_et ?? '',
      predicted_went_to_pens: p.predicted_went_to_pens,
      predicted_pen_winner: p.predicted_pen_winner,
      predicted_winner: p.predicted_winner,
    })
  }
  return map
}

export function createEmptyDraft(match: Match): DraftPrediction {
  return {
    match_id: match.id,
    predicted_home: match.home_team ?? '',
    predicted_away: match.away_team ?? '',
    predicted_home_goals_90: '',
    predicted_away_goals_90: '',
    predicted_went_to_et: false,
    predicted_home_goals_et: '',
    predicted_away_goals_et: '',
    predicted_went_to_pens: false,
    predicted_pen_winner: null,
    predicted_winner: '',
  }
}

export function propagateWinner(
  draft: Map<number, DraftPrediction>,
  matches: Match[],
  matchId: number,
  winnerTeam: string
): Map<number, DraftPrediction> {
  const updated = new Map(draft)
  const match = matches.find((m) => m.id === matchId)
  if (!match || !match.next_match_id) return updated

  const nextMatch = matches.find((m) => m.id === match.next_match_id)
  if (!nextMatch) return updated

  const existingNext = updated.get(match.next_match_id) ?? createEmptyDraft(nextMatch)
  const nextDraft = { ...existingNext }

  if (match.next_match_slot === 'home') {
    nextDraft.predicted_home = winnerTeam
    // Si el ganador cambió, limpiar el winner predicho del siguiente partido
    if (existingNext.predicted_home !== winnerTeam) {
      nextDraft.predicted_winner = ''
      nextDraft.predicted_home_goals_90 = ''
      nextDraft.predicted_away_goals_90 = ''
      nextDraft.predicted_went_to_et = false
      nextDraft.predicted_home_goals_et = ''
      nextDraft.predicted_away_goals_et = ''
      nextDraft.predicted_went_to_pens = false
      nextDraft.predicted_pen_winner = null
    }
  } else {
    nextDraft.predicted_away = winnerTeam
    if (existingNext.predicted_away !== winnerTeam) {
      nextDraft.predicted_winner = ''
      nextDraft.predicted_home_goals_90 = ''
      nextDraft.predicted_away_goals_90 = ''
      nextDraft.predicted_went_to_et = false
      nextDraft.predicted_home_goals_et = ''
      nextDraft.predicted_away_goals_et = ''
      nextDraft.predicted_went_to_pens = false
      nextDraft.predicted_pen_winner = null
    }
  }

  updated.set(match.next_match_id, nextDraft)

  // Propagar el PERDEDOR al partido de 3er puesto (solo para semifinales)
  if (match.loser_next_match_id) {
    const currentDraft = updated.get(matchId)
    if (currentDraft) {
      const loserTeam = winnerTeam === currentDraft.predicted_home
        ? currentDraft.predicted_away
        : currentDraft.predicted_home

      if (loserTeam) {
        const thirdMatch = matches.find((m) => m.id === match.loser_next_match_id)
        if (thirdMatch) {
          const existingThird = updated.get(match.loser_next_match_id!) ?? createEmptyDraft(thirdMatch)
          const thirdDraft = { ...existingThird }
          // Usamos el mismo slot que el ganador tiene en la final
          const loserSlot = match.next_match_slot
          if (loserSlot === 'home') {
            if (thirdDraft.predicted_home !== loserTeam) {
              thirdDraft.predicted_home = loserTeam
              thirdDraft.predicted_winner = ''
              thirdDraft.predicted_home_goals_90 = ''
              thirdDraft.predicted_away_goals_90 = ''
              thirdDraft.predicted_went_to_et = false
              thirdDraft.predicted_home_goals_et = ''
              thirdDraft.predicted_away_goals_et = ''
              thirdDraft.predicted_went_to_pens = false
              thirdDraft.predicted_pen_winner = null
            }
          } else {
            if (thirdDraft.predicted_away !== loserTeam) {
              thirdDraft.predicted_away = loserTeam
              thirdDraft.predicted_winner = ''
              thirdDraft.predicted_home_goals_90 = ''
              thirdDraft.predicted_away_goals_90 = ''
              thirdDraft.predicted_went_to_et = false
              thirdDraft.predicted_home_goals_et = ''
              thirdDraft.predicted_away_goals_et = ''
              thirdDraft.predicted_went_to_pens = false
              thirdDraft.predicted_pen_winner = null
            }
          }
          updated.set(match.loser_next_match_id!, thirdDraft)
        }
      }
    }
  }

  // Si el siguiente partido ya tenía un winner predicho que dependía del anterior, propagarlo recursivamente
  if (nextDraft.predicted_winner && nextDraft.predicted_winner !== '') {
    return propagateWinner(updated, matches, match.next_match_id, nextDraft.predicted_winner)
  }

  return updated
}

// Rellena los equipos del 3er puesto a partir de los perdedores de las semis ya guardadas
export function populateThirdPlace(draft: Map<number, DraftPrediction>, matches: Match[]): Map<number, DraftPrediction> {
  const thirdMatch = matches.find((m) => m.round === '3RD')
  if (!thirdMatch) return draft

  const sfMatches = matches.filter((m) => m.round === 'SF' && m.loser_next_match_id === thirdMatch.id)
  if (sfMatches.length === 0) return draft

  const updated = new Map(draft)
  const existingThird = updated.get(thirdMatch.id) ?? createEmptyDraft(thirdMatch)
  const thirdDraft = { ...existingThird }
  let changed = false

  for (const sf of sfMatches) {
    const sfDraft = updated.get(sf.id)
    if (!sfDraft?.predicted_winner) continue
    const loser = sfDraft.predicted_winner === sfDraft.predicted_home
      ? sfDraft.predicted_away
      : sfDraft.predicted_home
    if (!loser) continue
    const slot = sf.next_match_slot
    if (slot === 'home' && thirdDraft.predicted_home !== loser) {
      thirdDraft.predicted_home = loser
      changed = true
    } else if (slot === 'away' && thirdDraft.predicted_away !== loser) {
      thirdDraft.predicted_away = loser
      changed = true
    }
  }

  if (changed) updated.set(thirdMatch.id, thirdDraft)
  return updated
}

export function updateDraftAndPropagate(
  draft: Map<number, DraftPrediction>,
  matches: Match[],
  matchId: number,
  updates: Partial<DraftPrediction>
): Map<number, DraftPrediction> {
  const updated = new Map(draft)
  const existing = updated.get(matchId) ?? createEmptyDraft(matches.find((m) => m.id === matchId)!)
  const newDraft = { ...existing, ...updates }

  // Recalcular predicted_winner
  newDraft.predicted_winner = derivePredictedWinner(newDraft)
  updated.set(matchId, newDraft)

  // Propagar winner al siguiente partido
  if (newDraft.predicted_winner) {
    return propagateWinner(updated, matches, matchId, newDraft.predicted_winner)
  }

  return updated
}

export function isDraftComplete(draft: Map<number, DraftPrediction>, matches: Match[]): boolean {
  for (const match of matches) {
    const pred = draft.get(match.id)
    if (!pred || !pred.predicted_winner) return false
    if (pred.predicted_home_goals_90 === '' || pred.predicted_away_goals_90 === '') return false
  }
  return true
}

export function countCompletedPredictions(draft: Map<number, DraftPrediction>, matches?: Match[]): number {
  let count = 0
  if (matches) {
    // Only count predictions for the given matches
    for (const match of matches) {
      const pred = draft.get(match.id)
      if (pred && pred.predicted_winner && pred.predicted_home_goals_90 !== '' && pred.predicted_away_goals_90 !== '') {
        count++
      }
    }
  } else {
    for (const pred of draft.values()) {
      if (pred.predicted_winner && pred.predicted_home_goals_90 !== '' && pred.predicted_away_goals_90 !== '') {
        count++
      }
    }
  }
  return count
}

export function groupMatchesByRound(matches: Match[]): Map<Round, Match[]> {
  const grouped = new Map<Round, Match[]>()
  for (const match of matches) {
    const existing = grouped.get(match.round) ?? []
    existing.push(match)
    grouped.set(match.round, existing)
  }
  return grouped
}

export function isDeadlinePassed(): boolean {
  const deadline = process.env.NEXT_PUBLIC_DEADLINE_ISO
  if (!deadline) return false
  return new Date() >= new Date(deadline)
}
