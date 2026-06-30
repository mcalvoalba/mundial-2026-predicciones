import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Match } from '@/lib/types'
import { ROUND_LABELS } from '@/lib/types'
import { CheckCircle2, Clock, Users } from 'lucide-react'
import { RecalcButton } from '@/components/admin/RecalcButton'

export default async function AdminPage() {
  const supabase = await createClient()

  const [matchesRes, profilesRes] = await Promise.all([
    supabase.from('matches').select('*').order('match_number'),
    supabase.from('profiles').select('id, display_name, created_at').order('created_at'),
  ])

  const matches = (matchesRes.data ?? []) as Match[]
  const profiles = profilesRes.data ?? []

  const locked = matches.filter((m) => m.result_locked).length
  const pending = matches.filter((m) => !m.result_locked && m.home_team && m.away_team).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{locked}</p>
          <p className="text-xs text-muted-foreground">Resultados</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{profiles.length}</p>
          <p className="text-xs text-muted-foreground">Participantes</p>
        </div>
      </div>

      {/* Recalc */}
      <RecalcButton />

      {/* Participants */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Participantes registrados</h2>
        </div>
        <div className="space-y-1">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border text-sm">
              <span>{p.display_name || '(sin nombre)'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matches by round */}
      {(['R32', 'R16', 'QF', 'SF', '3RD', 'FINAL'] as const).map((round) => {
        const roundMatches = matches.filter((m) => m.round === round)
        if (roundMatches.length === 0) return null
        return (
          <div key={round}>
            <h2 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">
              {ROUND_LABELS[round]}
            </h2>
            <div className="space-y-2">
              {roundMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/admin/match/${match.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-green-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">P{match.match_number}</span>
                      {match.result_locked ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium mt-0.5">
                      {match.home_team || match.home_seed || '?'} vs{' '}
                      {match.away_team || match.away_seed || '?'}
                    </p>
                    {match.result_locked && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {match.home_goals_90} - {match.away_goals_90}
                        {match.went_to_et && ` (ET: ${match.home_goals_et}-${match.away_goals_et})`}
                        {match.went_to_pens && ` • Pens: ${match.pen_winner}`}
                        {' → '}<strong>{match.winner_team}</strong>
                      </p>
                    )}
                  </div>
                  <Badge variant={match.result_locked ? 'default' : 'secondary'} className="flex-shrink-0">
                    {match.result_locked ? 'Jugado' : 'Pendiente'}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
