'use client'

import { cn } from '@/lib/utils'
import type { Match, DraftPrediction } from '@/lib/types'
import { CheckCircle2, Circle } from 'lucide-react'

interface MatchCardProps {
  match: Match
  draft?: DraftPrediction
  mode: 'edit' | 'view'
  onClick?: () => void
}

export function MatchCard({ match, draft, mode, onClick }: MatchCardProps) {
  const homeTeam = draft?.predicted_home || match.home_team || match.home_seed || '?'
  const awayTeam = draft?.predicted_away || match.away_team || match.away_seed || '?'
  const hasScore = draft && draft.predicted_home_goals_90 !== '' && draft.predicted_away_goals_90 !== ''
  const hasWinner = !!draft?.predicted_winner
  const isComplete = hasScore && hasWinner

  const homeGoals = hasScore ? draft!.predicted_home_goals_90 : null
  const awayGoals = hasScore ? draft!.predicted_away_goals_90 : null

  return (
    <button
      onClick={mode === 'edit' ? onClick : undefined}
      disabled={mode === 'edit' && (!match.home_team && !match.home_seed)}
      className={cn(
        'w-40 rounded-lg border bg-card text-left transition-all',
        mode === 'edit' && 'hover:border-green-600 hover:shadow-sm active:scale-95 cursor-pointer',
        mode === 'view' && 'cursor-default',
        isComplete && 'border-green-600/50',
        !isComplete && mode === 'edit' && 'border-border',
        (!match.home_team && !match.home_seed) && 'opacity-40 cursor-not-allowed'
      )}
    >
      <div className="p-2 space-y-1">
        {/* Home */}
        <div className={cn(
          'flex items-center justify-between gap-1 text-xs',
          draft?.predicted_winner === draft?.predicted_home && 'font-bold text-green-700'
        )}>
          <span className="truncate flex-1">{homeTeam}</span>
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
          <span className="truncate flex-1">{awayTeam}</span>
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
