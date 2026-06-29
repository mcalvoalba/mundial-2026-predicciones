'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { Match, DraftPrediction } from '@/lib/types'
import { derivePredictedWinner } from '@/lib/scoring'
import { ChevronRight } from 'lucide-react'
import { getFlag } from '@/lib/flags'

interface PredictionFormProps {
  match: Match
  draft: DraftPrediction
  open: boolean
  onClose: () => void
  onSave: (draft: DraftPrediction) => void
}

export function PredictionForm({ match, draft, open, onClose, onSave }: PredictionFormProps) {
  const [form, setForm] = useState<DraftPrediction>(draft)

  useEffect(() => {
    setForm(draft)
  }, [draft, open])

  function updateField<K extends keyof DraftPrediction>(key: K, value: DraftPrediction[K]) {
    setForm((prev) => {
      const updated = { ...prev, [key]: value }

      // Auto-lógica: si el marcador de 90min es empate, forzar ET
      const h90 = Number(updated.predicted_home_goals_90)
      const a90 = Number(updated.predicted_away_goals_90)
      if (updated.predicted_home_goals_90 !== '' && updated.predicted_away_goals_90 !== '') {
        if (h90 === a90) {
          updated.predicted_went_to_et = true
        } else {
          // Si ya no hay empate, limpiar ET y penaltis
          updated.predicted_went_to_et = false
          updated.predicted_home_goals_et = ''
          updated.predicted_away_goals_et = ''
          updated.predicted_went_to_pens = false
          updated.predicted_pen_winner = null
        }
      }

      // Si hay ET, comprobar si hay empate en ET para forzar penaltis
      if (updated.predicted_went_to_et) {
        const het = Number(updated.predicted_home_goals_et)
        const aet = Number(updated.predicted_away_goals_et)
        if (updated.predicted_home_goals_et !== '' && updated.predicted_away_goals_et !== '') {
          if (het === aet) {
            updated.predicted_went_to_pens = true
          } else {
            updated.predicted_went_to_pens = false
            updated.predicted_pen_winner = null
          }
        }
      }

      updated.predicted_winner = derivePredictedWinner(updated)
      return updated
    })
  }

  function isValid(): boolean {
    if (form.predicted_home_goals_90 === '' || form.predicted_away_goals_90 === '') return false
    const h90 = Number(form.predicted_home_goals_90)
    const a90 = Number(form.predicted_away_goals_90)
    if (h90 === a90) {
      // Necesita ET
      if (form.predicted_home_goals_et === '' || form.predicted_away_goals_et === '') return false
      const het = Number(form.predicted_home_goals_et)
      const aet = Number(form.predicted_away_goals_et)
      if (het === aet) {
        // Necesita penaltis
        if (!form.predicted_pen_winner) return false
      }
    }
    return !!form.predicted_winner
  }

  function handleSave() {
    if (!isValid()) return
    onSave(form)
    onClose()
  }

  const h90 = Number(form.predicted_home_goals_90)
  const a90 = Number(form.predicted_away_goals_90)
  const showET = form.predicted_went_to_et || (form.predicted_home_goals_90 !== '' && form.predicted_away_goals_90 !== '' && h90 === a90)
  const het = Number(form.predicted_home_goals_et)
  const aet = Number(form.predicted_away_goals_et)
  const showPens = form.predicted_went_to_pens || (showET && form.predicted_home_goals_et !== '' && form.predicted_away_goals_et !== '' && het === aet)

  const homeLabel = form.predicted_home || match.home_seed || 'Local'
  const awayLabel = form.predicted_away || match.away_seed || 'Visitante'
  const homeFlag = getFlag(form.predicted_home || match.home_team)
  const awayFlag = getFlag(form.predicted_away || match.away_team)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">
            {homeFlag} {homeLabel} vs {awayFlag} {awayLabel}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-4">
          {/* 90 min score */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Resultado a 90 minutos</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1 truncate">{homeFlag} {homeLabel}</p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="20"
                  className="text-center text-2xl font-bold h-14 text-foreground"
                  value={form.predicted_home_goals_90}
                  onChange={(e) => updateField('predicted_home_goals_90', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <span className="text-2xl font-bold text-muted-foreground">-</span>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1 truncate">{awayFlag} {awayLabel}</p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="20"
                  className="text-center text-2xl font-bold h-14 text-foreground"
                  value={form.predicted_away_goals_90}
                  onChange={(e) => updateField('predicted_away_goals_90', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
            {form.predicted_home_goals_90 !== '' && form.predicted_away_goals_90 !== '' && h90 === a90 && (
              <p className="text-xs text-amber-600 mt-2 text-center">Empate → se va a prórroga</p>
            )}
          </div>

          {/* ET */}
          {showET && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Resultado tras prórroga (120 min)</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1 truncate">{homeFlag} {homeLabel}</p>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={Number(form.predicted_home_goals_90) || 0}
                    max="20"
                    className="text-center text-2xl font-bold h-14"
                    value={form.predicted_home_goals_et}
                    onChange={(e) => updateField('predicted_home_goals_et', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(form.predicted_home_goals_90 || 0)}
                  />
                </div>
                <span className="text-2xl font-bold text-muted-foreground">-</span>
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1 truncate">{awayFlag} {awayLabel}</p>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={Number(form.predicted_away_goals_90) || 0}
                    max="20"
                    className="text-center text-2xl font-bold h-14"
                    value={form.predicted_away_goals_et}
                    onChange={(e) => updateField('predicted_away_goals_et', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(form.predicted_away_goals_90 || 0)}
                  />
                </div>
              </div>
              {form.predicted_home_goals_et !== '' && form.predicted_away_goals_et !== '' && het === aet && (
                <p className="text-xs text-amber-600 mt-2 text-center">Empate en prórroga → se va a penaltis</p>
              )}
            </div>
          )}

          {/* Penalties */}
          {showPens && (
            <div>
              <Label className="text-sm font-medium mb-3 block">¿Quién gana los penaltis?</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField('predicted_pen_winner', 'home')}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition-colors ${
                    form.predicted_pen_winner === 'home'
                      ? 'border-green-600 bg-green-600/10 text-green-700'
                      : 'border-border hover:border-green-600/50'
                  }`}
                >
                  {homeLabel}
                </button>
                <button
                  type="button"
                  onClick={() => updateField('predicted_pen_winner', 'away')}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition-colors ${
                    form.predicted_pen_winner === 'away'
                      ? 'border-green-600 bg-green-600/10 text-green-700'
                      : 'border-border hover:border-green-600/50'
                  }`}
                >
                  {awayLabel}
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          {form.predicted_winner && (
            <div className="flex items-center gap-2 p-3 bg-green-600/10 rounded-lg">
              <ChevronRight className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm">
                <span className="text-muted-foreground">Clasificado: </span>
                <span className="font-semibold text-green-700">{form.predicted_winner}</span>
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col gap-2">
          <Button onClick={handleSave} disabled={!isValid()} className="w-full bg-green-600 hover:bg-green-700">
            Confirmar predicción
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
