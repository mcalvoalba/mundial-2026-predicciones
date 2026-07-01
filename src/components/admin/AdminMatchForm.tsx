'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Match } from '@/lib/types'

interface AdminMatchFormProps {
  match: Match
}

export function AdminMatchForm({ match }: AdminMatchFormProps) {
  const router = useRouter()

  const [homeTeam, setHomeTeam] = useState(match.home_team ?? '')
  const [awayTeam, setAwayTeam] = useState(match.away_team ?? '')
  const [home90, setHome90] = useState(match.home_goals_90 !== null ? String(match.home_goals_90) : '')
  const [away90, setAway90] = useState(match.away_goals_90 !== null ? String(match.away_goals_90) : '')
  const [wentToET, setWentToET] = useState(match.went_to_et)
  const [homeET, setHomeET] = useState(match.home_goals_et !== null ? String(match.home_goals_et) : '')
  const [awayET, setAwayET] = useState(match.away_goals_et !== null ? String(match.away_goals_et) : '')
  const [wentToPens, setWentToPens] = useState(match.went_to_pens)
  const [penWinner, setPenWinner] = useState<'home' | 'away' | ''>(match.pen_winner ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function getWinnerTeam(): string {
    if (wentToPens && penWinner) {
      return penWinner === 'home' ? homeTeam : awayTeam
    }
    if (wentToET && homeET !== '' && awayET !== '') {
      const het = Number(homeET)
      const aet = Number(awayET)
      if (het > aet) return homeTeam
      if (aet > het) return awayTeam
    }
    if (home90 !== '' && away90 !== '') {
      const h = Number(home90)
      const a = Number(away90)
      if (h > a) return homeTeam
      if (a > h) return awayTeam
    }
    return ''
  }

  // Only save team names (before the match is played, so users can see teams in bracket)
  async function handleSaveTeams() {
    if (!homeTeam || !awayTeam) { setError('Introduce ambos equipos'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()

    try {
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          home_team: homeTeam,
          away_team: awayTeam,
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.id)

      if (matchError) throw matchError
      setSuccess('¡Equipos guardados! Ya aparecen en el cuadro.')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Save result, lock, advance bracket, and calculate points
  async function handleSaveResult() {
    if (!homeTeam || !awayTeam) { setError('Introduce los equipos'); return }
    if (home90 === '' || away90 === '') { setError('Introduce el resultado a 90 minutos'); return }
    const winner = getWinnerTeam()
    if (!winner) { setError('No se puede determinar el ganador'); return }

    setSaving(true)
    setError('')
    const supabase = createClient()

    try {
      const matchUpdate = {
        home_team: homeTeam,
        away_team: awayTeam,
        home_goals_90: Number(home90),
        away_goals_90: Number(away90),
        went_to_et: wentToET,
        home_goals_et: wentToET && homeET !== '' ? Number(homeET) : null,
        away_goals_et: wentToET && awayET !== '' ? Number(awayET) : null,
        went_to_pens: wentToPens,
        pen_winner: wentToPens && penWinner ? penWinner : null,
        winner_team: winner,
        result_locked: true,
        updated_at: new Date().toISOString(),
      }

      const { error: matchError } = await supabase
        .from('matches')
        .update(matchUpdate)
        .eq('id', match.id)

      if (matchError) throw matchError

      // Avanzar al ganador en el siguiente partido
      if (match.next_match_id && match.next_match_slot) {
        const slot = match.next_match_slot === 'home' ? 'home_team' : 'away_team'
        await supabase
          .from('matches')
          .update({ [slot]: winner, updated_at: new Date().toISOString() })
          .eq('id', match.next_match_id)
      }

      // Poner al perdedor en el 3er puesto (solo Semis)
      if (match.loser_next_match_id) {
        const loser = winner === homeTeam ? awayTeam : homeTeam
        const loserSlot = match.next_match_slot === 'home' ? 'away_team' : 'home_team'
        await supabase
          .from('matches')
          .update({ [loserSlot]: loser, updated_at: new Date().toISOString() })
          .eq('id', match.loser_next_match_id)
      }

      // Calcular puntos para todas las predicciones vía función SECURITY DEFINER (omite RLS)
      await supabase.rpc('recalc_match_points', { p_match_id: match.id })

      router.push('/admin')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const predictedWinner = getWinnerTeam()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Partido {match.match_number}
          {match.result_locked && (
            <span className="ml-2 text-sm font-normal text-green-600">✓ Resultado bloqueado</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Teams */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Equipos</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Local ({match.home_seed ?? 'equipo A'})</Label>
              <Input
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder={match.home_seed ?? 'Ej: España'}
                className="mt-1"
                disabled={match.result_locked}
              />
            </div>
            <div>
              <Label className="text-xs">Visitante ({match.away_seed ?? 'equipo B'})</Label>
              <Input
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder={match.away_seed ?? 'Ej: Alemania'}
                className="mt-1"
                disabled={match.result_locked}
              />
            </div>
          </div>
          {!match.result_locked && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTeams}
              disabled={saving || !homeTeam || !awayTeam}
              className="mt-2 w-full"
            >
              Guardar equipos (sin resultado aún)
            </Button>
          )}
          {success && <p className="text-sm text-green-600 mt-1">{success}</p>}
        </div>

        {/* 90min score */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Resultado</p>
          <Label className="text-xs">A 90 minutos</Label>
          <div className="flex items-center gap-3 mt-1.5">
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              className="text-center text-xl font-bold h-12"
              value={home90}
              onChange={(e) => setHome90(e.target.value)}
              placeholder="0"
              disabled={match.result_locked}
            />
            <span className="text-xl font-bold text-muted-foreground">-</span>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              className="text-center text-xl font-bold h-12"
              value={away90}
              onChange={(e) => setAway90(e.target.value)}
              placeholder="0"
              disabled={match.result_locked}
            />
          </div>
        </div>

        {/* ET toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="et"
            checked={wentToET}
            onChange={(e) => {
              setWentToET(e.target.checked)
              if (!e.target.checked) { setWentToPens(false); setPenWinner('') }
            }}
            className="h-4 w-4 rounded accent-green-600"
            disabled={match.result_locked}
          />
          <Label htmlFor="et" className="text-sm cursor-pointer">
            Hubo prórroga
          </Label>
        </div>

        {wentToET && (
          <div>
            <Label className="text-xs">Tras prórroga (120 min total)</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <Input
                type="number" inputMode="numeric" min="0"
                className="text-center text-xl font-bold h-12"
                value={homeET}
                onChange={(e) => setHomeET(e.target.value)}
                placeholder={home90 || '0'}
                disabled={match.result_locked}
              />
              <span className="text-xl font-bold text-muted-foreground">-</span>
              <Input
                type="number" inputMode="numeric" min="0"
                className="text-center text-xl font-bold h-12"
                value={awayET}
                onChange={(e) => setAwayET(e.target.value)}
                placeholder={away90 || '0'}
                disabled={match.result_locked}
              />
            </div>
          </div>
        )}

        {wentToET && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pens"
              checked={wentToPens}
              onChange={(e) => { setWentToPens(e.target.checked); if (!e.target.checked) setPenWinner('') }}
              className="h-4 w-4 rounded accent-green-600"
              disabled={match.result_locked}
            />
            <Label htmlFor="pens" className="text-sm cursor-pointer">Hubo penaltis</Label>
          </div>
        )}

        {wentToPens && (
          <div>
            <Label className="text-xs font-medium mb-2 block">Ganador en penaltis</Label>
            <div className="flex gap-3">
              {(['home', 'away'] as const).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPenWinner(slot)}
                  disabled={match.result_locked}
                  className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition-colors ${
                    penWinner === slot
                      ? 'border-green-600 bg-green-600/10 text-green-700'
                      : 'border-border'
                  }`}
                >
                  {slot === 'home' ? homeTeam || 'Local' : awayTeam || 'Visitante'}
                </button>
              ))}
            </div>
          </div>
        )}

        {predictedWinner && !match.result_locked && (
          <div className="p-3 bg-green-600/10 rounded-lg text-sm">
            <span className="text-muted-foreground">Clasificado: </span>
            <strong className="text-green-700">{predictedWinner}</strong>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!match.result_locked && (
          <Button
            onClick={handleSaveResult}
            disabled={saving || !predictedWinner}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {saving ? 'Guardando...' : '✓ Guardar resultado y calcular puntos'}
          </Button>
        )}

        {match.result_locked && (
          <div className="text-center text-sm text-muted-foreground py-2">
            Resultado bloqueado. Editar directamente en Supabase si hay error.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
