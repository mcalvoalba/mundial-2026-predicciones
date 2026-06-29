'use client'

import { useState, useEffect, useCallback } from 'react'
import { BracketTree } from '@/components/bracket/BracketTree'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import {
  loadDraftFromStorage,
  saveDraftToStorage,
  clearDraftFromStorage,
  predictionsToMap,
  isDraftComplete,
  countCompletedPredictions,
  populateThirdPlace,
} from '@/lib/bracket'
import type { Match, Prediction, DraftPrediction } from '@/lib/types'
import { Lock, Send } from 'lucide-react'

interface BracketClientProps {
  userId: string
  matches: Match[]
  existingPredictions: Prediction[]
  isLocked: boolean
  deadlineISO: string | null
}

export function BracketClient({ userId, matches, existingPredictions, isLocked, deadlineISO }: BracketClientProps) {
  const [draft, setDraft] = useState<Map<number, DraftPrediction>>(() => {
    if (existingPredictions.length > 0) {
      return predictionsToMap(existingPredictions)
    }
    return new Map()
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Load from localStorage on mount (only if no existing predictions)
  useEffect(() => {
    if (isLocked || existingPredictions.length > 0) return
    const stored = loadDraftFromStorage(userId)
    if (stored.size > 0) {
      // Retroactively populate 3rd place teams from SF losers already in draft
      setDraft(populateThirdPlace(stored, matches))
    }
  }, [userId, isLocked, existingPredictions.length, matches])

  const handleDraftChange = useCallback((newDraft: Map<number, DraftPrediction>) => {
    setDraft(newDraft)
    saveDraftToStorage(userId, newDraft)
  }, [userId])

  async function handleSubmit() {
    setConfirmOpen(false)
    setSaving(true)
    setSaveError('')
    const supabase = createClient()

    try {
      const predictionsArray = Array.from(draft.values()).map((p) => ({
        user_id: userId,
        match_id: p.match_id,
        predicted_home: p.predicted_home,
        predicted_away: p.predicted_away,
        predicted_home_goals_90: Number(p.predicted_home_goals_90),
        predicted_away_goals_90: Number(p.predicted_away_goals_90),
        predicted_went_to_et: p.predicted_went_to_et,
        predicted_home_goals_et: p.predicted_home_goals_et === '' ? null : Number(p.predicted_home_goals_et),
        predicted_away_goals_et: p.predicted_away_goals_et === '' ? null : Number(p.predicted_away_goals_et),
        predicted_went_to_pens: p.predicted_went_to_pens,
        predicted_pen_winner: p.predicted_pen_winner,
        predicted_winner: p.predicted_winner,
      }))

      const { error: predError } = await supabase
        .from('predictions')
        .upsert(predictionsArray, { onConflict: 'user_id,match_id' })

      if (predError) throw predError

      const { error: subError } = await supabase
        .from('bracket_submissions')
        .upsert({
          user_id: userId,
          submitted_at: new Date().toISOString(),
          is_locked: true,
        }, { onConflict: 'user_id' })

      if (subError) throw subError

      clearDraftFromStorage(userId)
      setSaved(true)
      window.location.reload()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Played matches (result_locked) don't need a user prediction
  const playableMatches = matches.filter((m) => !m.result_locked)
  const complete = isDraftComplete(draft, playableMatches)
  const completed = countCompletedPredictions(draft, playableMatches)
  const total = playableMatches.length

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-4">
        <span className="text-4xl">⚽</span>
        <h2 className="text-lg font-semibold">Cuadro pendiente de configurar</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          El administrador todavía no ha introducido los equipos. Vuelve en unos minutos.
        </p>
      </div>
    )
  }

  if (isLocked && existingPredictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-4">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Predicciones cerradas</h2>
        <p className="text-sm text-muted-foreground">
          El plazo para enviar la porra ha terminado.
        </p>
      </div>
    )
  }

  return (
    <div>
      <BracketTree
        matches={matches}
        draft={draft}
        mode={isLocked ? 'view' : 'edit'}
        onDraftChange={isLocked ? undefined : handleDraftChange}
      />

      {!isLocked && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-30">
          <div className="max-w-sm mx-auto">
            {saveError && (
              <p className="text-xs text-destructive text-center mb-2">{saveError}</p>
            )}
            <Button
              className="w-full bg-green-600 hover:bg-green-700 shadow-lg"
              disabled={!complete || saving}
              size="lg"
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              {complete
                ? 'Enviar mi Porra'
                : `Rellena los ${total - completed} partidos que faltan`}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Seguro que quieres enviar?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez enviada tu porra, no podrás cambiar ninguna predicción. Esta acción es
              irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={saving}
            >
              {saving ? 'Enviando...' : 'Sí, enviar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLocked && existingPredictions.length > 0 && (
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Porra enviada y bloqueada</span>
          </div>
        </div>
      )}
    </div>
  )
}
