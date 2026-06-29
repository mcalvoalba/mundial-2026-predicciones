'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match, Round } from '@/lib/types'
import { ROUND_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock } from 'lucide-react'

const ROUND_SEQUENCE: Round[] = ['R32', 'R16', 'QF', 'SF', 'FINAL']

interface LiveMatchCardProps {
  match: Match
}

function LiveMatchCard({ match }: LiveMatchCardProps) {
  const hasResult = match.result_locked
  const homeWon = match.winner_team === match.home_team
  const awayWon = match.winner_team === match.away_team

  return (
    <div className={cn(
      'w-40 rounded-lg border bg-card text-xs',
      hasResult ? 'border-green-600/40' : 'border-border'
    )}>
      <div className="p-2 space-y-1">
        <div className={cn('flex items-center justify-between gap-1', homeWon && 'font-bold text-green-700')}>
          <span className="truncate flex-1">{match.home_team || match.home_seed || '?'}</span>
          {hasResult && <span className="tabular-nums font-semibold">{match.home_goals_90}</span>}
        </div>
        <div className="border-t border-border/50" />
        <div className={cn('flex items-center justify-between gap-1', awayWon && 'font-bold text-green-700')}>
          <span className="truncate flex-1">{match.away_team || match.away_seed || '?'}</span>
          {hasResult && <span className="tabular-nums font-semibold">{match.away_goals_90}</span>}
        </div>
        <div className="flex items-center gap-1 pt-0.5">
          {hasResult ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-[10px] text-muted-foreground">
                {match.went_to_pens ? 'Penaltis' : match.went_to_et ? 'Prórroga' : '90 min'}
              </span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Pendiente</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function LiveBracketClient({ matches: initialMatches }: { matches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('live-bracket')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
        setMatches((prev) =>
          prev.map((m) => m.id === payload.new.id ? payload.new as Match : m)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function getMatchesForRound(round: Round): Match[] {
    return matches.filter((m) => m.round === round).sort((a, b) => a.match_number - b.match_number)
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex gap-6 p-4 min-w-max">
          {ROUND_SEQUENCE.map((round) => {
            const roundMatches = getMatchesForRound(round)
            if (roundMatches.length === 0) return null
            return (
              <div key={round} className="flex flex-col gap-2">
                <h3 className="text-xs font-medium text-muted-foreground text-center">
                  {ROUND_LABELS[round]}
                </h3>
                <div
                  className="flex flex-col gap-3 justify-around"
                  style={{ minHeight: `${Math.max(roundMatches.length * 80, 80)}px` }}
                >
                  {roundMatches.map((match) => (
                    <LiveMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* 3rd place */}
        {getMatchesForRound('3RD').length > 0 && (
          <div className="px-4 pb-4">
            <div className="border-t border-dashed border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">{ROUND_LABELS['3RD']}</p>
              <div className="flex gap-3">
                {getMatchesForRound('3RD').map((match) => (
                  <LiveMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
