'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculatePoints } from '@/lib/scoring'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import type { Match, Prediction } from '@/lib/types'

export function RecalcButton() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState('')

  async function handleRecalc() {
    setRunning(true)
    setResult('')
    const supabase = createClient()

    try {
      // Fetch all locked matches with results
      const { data: matches, error: matchErr } = await supabase
        .from('matches')
        .select('*')
        .eq('result_locked', true)
        .not('winner_team', 'is', null)

      if (matchErr) throw matchErr
      if (!matches || matches.length === 0) {
        setResult('No hay partidos con resultado todavía.')
        return
      }

      // Fetch all predictions for those matches
      const matchIds = matches.map((m: Match) => m.id)
      const { data: predictions, error: predErr } = await supabase
        .from('predictions')
        .select('*')
        .in('match_id', matchIds)

      if (predErr) throw predErr
      if (!predictions || predictions.length === 0) {
        setResult('No hay predicciones que recalcular.')
        return
      }

      // Recalculate and batch update
      const matchMap = new Map<number, Match>(matches.map((m: Match) => [m.id, m]))
      let updated = 0

      for (const pred of predictions as Prediction[]) {
        const match = matchMap.get(pred.match_id)
        if (!match) continue
        const pts = calculatePoints(pred, match)
        const { error } = await supabase
          .from('predictions')
          .update({ points_earned: pts })
          .eq('id', pred.id)
        if (!error) updated++
      }

      setResult(`✓ ${updated} predicciones actualizadas en ${matches.length} partidos.`)
    } catch (err: unknown) {
      setResult(`Error: ${err instanceof Error ? err.message : 'desconocido'}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleRecalc}
        disabled={running}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
        {running ? 'Recalculando...' : 'Recalcular puntuación'}
      </Button>
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  )
}
