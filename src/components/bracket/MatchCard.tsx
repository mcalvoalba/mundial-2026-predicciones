'use client'

import { cn } from '@/lib/utils'
import type { Match, DraftPrediction } from '@/lib/types'
import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { getFlag } from '@/lib/flags'

interface MatchCardProps {
  match: Match
  draft?: DraftPrediction
  mode: 'edit' | 'view'
  onClick?: () => void
}

export function MatchCard({ match, draft, mode, onClick }: MatchCardProps) {
  // Partido ya jugado: mostrar resultado real y bloquear edición
  if (match.result_locked && mode === 'edit') {
    const homeFlag = getFlag(match.home_team)
    const awayFlag = getFlag(match.away_team)
    const homeWon = match.winner_team === match.home_team
    const awayWon = match.winner_team === match.away_team
    const suffix = match.went_to_pens ? 'pen.' : match.went_to_et ? 'pró.' : ''
    return (
      <div className="w-40 rounded-lg border border-green-600/40 bg-green-600/5 text-left cursor-not-allowed select-none">
        <div className="p-2 space-y-1">
          <div className={cn('flex items-center justify-between gap-1 text-xs', homeWon && 'font-bold text-green-700')}>
            <span className="truncate flex-1">
              {homeFlag && <span className="mr-1">{homeFlag}</span>}
              {match.home_team || match.home_seed || '?'}
            </span>
            {match.home_goals_90 !== null && (
              <span className="tabular-nums font-semibold text-sm">{match.home_goals_90}</span>
            )}
          </div>
          <div className="border-t border-border/50" />
          <div className={cn('flex items-center justify-between gap-1 text-xs', awayWon && 'font-bold text-green-700')}>
            <span className="truncate flex-1">
              {awayFlag && <span className="mr-1">{awayFlag}</span>}
              {match.away_team || match.away_seed || '?'}
            </span>
            {match.away_goals_90 !== null && (
              <span className="tabular-nums font-semibold text-sm">{match.away_goals_90}</span>
            )}
          </div>
          <div className="flex items-center gap-1 pt-0.5">
            <Lock className="h-3 w-3 text-green-600" />
            <span className="text-[10px] text-green-600 font-medium">
              Jugado{suffix ? ` (${suffix})` : ''}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const homeTeam = draft?.predicted_home || match.home_team || match.home_seed || '?'
  const awayTeam = draft?.predicted_away || match.away_team || match.away_seed || '?'
  const homeFlag = getFlag(draft?.predicted_home || match.home_team)
  const awayFlag = getFlag(draft?.predicted_away || match.away_team)
  const hasScore = draft && draft.predicted_home_goals_90 !== '' && draft.predicted_away_goals_90 !== ''
  const hasWinner = !!draft?.predicted_winner
  const isComplete = hasScore && hasWinner

  const homeGoals = hasScore ? draft!.predicted_home_goals_90 : null
  const awayGoals = hasScore ? draft!.predicted_away_goals_90 : null

  // Enable the card if either the DB has teams OR the user's draft has propagated winners
  const hasTeams = !!(match.home_team || match.home_seed || draft?.predicted_home || draft?.predicted_away)

  return (
    <button
      onClick={mode === 'edit' ? onClick : undefined}
      disabled={mode === 'edit' && !hasTeams}
      className={cn(
        'w-40 rounded-lg border bg-card text-left transition-all',
        mode === 'edit' && hasTeams && 'hover:border-green-600 hover:shadow-sm active:scale-95 cursor-pointer',
        mode === 'view' && 'cursor-default',
        isComplete && 'border-green-600/50',
        !isComplete && mode === 'edit' && 'border-border',
        !hasTeams && 'opacity-40 cursor-not-allowed'
      )}
    >
      <div className="p-2 space-y-1">
        {/* Home */}
        <div className={cn(
          'flex items-center justify-between gap-1 text-xs',
          draft?.predicted_winner === draft?.predicted_home && 'font-bold text-green-700'
        )}>
          <span className="truncate flex-1">{homeFlag && <span className="mr-1">{homeFlag}</span>}{homeTeam}</span>
          {homeGoals !== null && (
            <span className="font-semibold tabular-nums text-sm">{homeGoals}</span>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-border/50" />

        {/* Away */}
        <div className={cn(
          'flex items-center justify-between gap-1 text-xs',
          draft?.predicted_winner === draft?.predicted_away && 'font-bold text-green-700'
        )}>
          <span className="truncate flex-1">{awayFlag && <span className="mr-1">{awayFlag}</span>}{awayTeam}</span>
          {awayGoals !== null && (
            <span className="font-semibold tabular-nums text-sm">{awayGoals}</span>
          )}
        </div>

        {/* Status */}
        {mode === 'edit' && (
          <div className="flex items-center gap-1 pt-0.5">
            {isComplete ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {isComplete
                ? draft.predicted_went_to_pens
                  ? 'Penaltis'
                  : draft.predicted_went_to_et
                  ? 'Prórroga'
                  : '90 min'
                : 'Toca para rellenar'}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
