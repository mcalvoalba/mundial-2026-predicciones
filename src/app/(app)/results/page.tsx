import { createClient } from '@/lib/supabase/server'
import type { Match, Prediction, Profile } from '@/lib/types'
import { ROUND_LABELS } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [matchesRes, predictionsRes, profilesRes] = await Promise.all([
    supabase.from('matches').select('*').eq('result_locked', true).order('match_number'),
    supabase.from('predictions').select('*').order('match_id'),
    supabase.from('profiles').select('id, display_name'),
  ])

  const matches = (matchesRes.data ?? []) as Match[]
  const allPredictions = (predictionsRes.data ?? []) as Prediction[]
  const profiles = (profilesRes.data ?? []) as Pick<Profile, 'id' | 'display_name'>[]

  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))

  if (matches.length === 0) {
    return (
      <div className="p-4 text-center py-12 text-muted-foreground">
        <p className="text-sm">Aún no hay partidos jugados.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {matches.map((match) => {
        const matchPreds = allPredictions.filter((p) => p.match_id === match.id)
        const myPred = matchPreds.find((p) => p.user_id === user?.id)

        return (
          <div key={match.id} className="space-y-2">
            {/* Match header */}
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium">{ROUND_LABELS[match.round]}</span>
                <Badge variant="secondary" className="text-xs">Jugado</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className={cn('text-sm font-semibold', match.winner_team === match.home_team && 'text-green-700')}>
                    {match.home_team}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums">
                    {match.home_goals_90} - {match.away_goals_90}
                  </p>
                  {match.went_to_et && (
                    <p className="text-xs text-muted-foreground">
                      {match.went_to_pens ? 'Pen' : 'ET'}: {match.home_goals_et}-{match.away_goals_et}
                    </p>
                  )}
                </div>
                <div className="flex-1 text-center">
                  <p className={cn('text-sm font-semibold', match.winner_team === match.away_team && 'text-green-700')}>
                    {match.away_team}
                  </p>
                </div>
              </div>
            </div>

            {/* Predictions list */}
            <div className="space-y-1.5 pl-1">
              {matchPreds
                .sort((a, b) => (b.points_earned ?? 0) - (a.points_earned ?? 0))
                .map((pred) => {
                const isCorrect = pred.predicted_winner === match.winner_team
                const pts = pred.points_earned ?? 0
                const name = profileMap.get(pred.user_id) ?? 'Desconocido'
                const isMe = pred.user_id === user?.id

                return (
                  <div
                    key={pred.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg border text-sm',
                      isMe ? 'border-green-600/50 bg-green-600/5' : 'border-border bg-card/50'
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className={cn('flex-1 truncate', isMe && 'font-medium')}>
                      {name}{isMe && ' (tú)'}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {pred.predicted_home_goals_90}-{pred.predicted_away_goals_90}
                      {pred.predicted_went_to_et && ` ET:${pred.predicted_home_goals_et}-${pred.predicted_away_goals_et}`}
                      {pred.predicted_went_to_pens && ` P:${pred.predicted_pen_winner}`}
                    </span>
                    <Badge
                      className={cn(
                        'text-xs flex-shrink-0',
                        pts >= 7 ? 'bg-yellow-500 text-yellow-950' :
                        pts === 6 ? 'bg-blue-500 text-white' :
                        pts === 5 ? 'bg-green-600 text-white' :
                        pts === 3 ? 'bg-secondary text-secondary-foreground' :
                        'bg-red-100 text-red-700'
                      )}
                    >
                      {pts} pts
                    </Badge>
                  </div>
                )
              })}
              {matchPreds.length === 0 && (
                <p className="text-xs text-muted-foreground pl-2">Nadie ha enviado porra aún.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
