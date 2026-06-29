'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import type { LeaderboardEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Medal, Trophy, ChevronRight } from 'lucide-react'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  hasSubmitted: boolean
}

const MEDAL_COLORS = ['text-yellow-500', 'text-slate-400', 'text-amber-600']

export function LeaderboardTable({ entries: initialEntries, currentUserId, hasSubmitted }: LeaderboardTableProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, async () => {
        const { data } = await supabase.from('leaderboard').select('*')
        if (data) setEntries(data as LeaderboardEntry[])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Aún no hay clasificación.</p>
        <p className="text-xs mt-1">Los puntos aparecerán cuando se jueguen los partidos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
        Clasificación
      </h2>
      {entries.map((entry, index) => {
        const isMe = entry.user_id === currentUserId
        const rank = index + 1
        const canViewBracket = hasSubmitted && !isMe
        return (
          <div
            key={entry.user_id}
            onClick={canViewBracket ? () => router.push(`/bracket/${entry.user_id}`) : undefined}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-colors',
              isMe ? 'border-green-600 bg-green-600/5' : 'border-border bg-card',
              canViewBracket && 'cursor-pointer hover:border-primary/40 hover:bg-accent/50 active:scale-[0.99]'
            )}
          >
            {/* Rank */}
            <div className="w-7 flex-shrink-0 text-center">
              {rank <= 3 ? (
                <Medal className={cn('h-5 w-5 mx-auto', MEDAL_COLORS[rank - 1])} />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">{rank}</span>
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={cn('font-semibold text-sm truncate', isMe && 'text-green-700')}>
                {entry.display_name}{isMe && ' (tú)'}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {Number(entry.perfect_et_pens) > 0 && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {entry.perfect_et_pens}× 8pts
                  </Badge>
                )}
                {Number(entry.perfect_pens) > 0 && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {entry.perfect_pens}× 7pts
                  </Badge>
                )}
                {Number(entry.exact_et) > 0 && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {entry.exact_et}× 6pts
                  </Badge>
                )}
                {Number(entry.exact_scores) > 0 && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {entry.exact_scores}× 5pts
                  </Badge>
                )}
              </div>
            </div>

            {/* Points */}
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold tabular-nums">{entry.total_points}</p>
              <p className="text-[10px] text-muted-foreground">{entry.matches_scored} jugados</p>
            </div>

            {canViewBracket && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}
