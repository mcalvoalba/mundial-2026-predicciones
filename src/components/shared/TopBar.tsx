'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, LogOut, Shield, BookOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

interface TopBarProps {
  title: string
  profile?: Profile | null
}

function RulesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-base">Reglas y puntuación</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5 pb-8">

          {/* Cómo funciona */}
          <div>
            <h3 className="text-sm font-semibold mb-2">¿Cómo funciona?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Antes del primer partido de dieciseisavos tienes que rellenar el cuadro completo: predice el resultado de los 32 partidos desde dieciseisavos hasta la final, incluyendo prórroga y penaltis si los hay. Los equipos de las rondas posteriores se rellenan automáticamente con tus predicciones de ganadores.
            </p>
          </div>

          {/* Sistema de puntuación */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Puntuación base</h3>
            <div className="space-y-2">
              {[
                { pts: '0 pts', desc: 'Ganador incorrecto', color: 'text-destructive' },
                { pts: '3 pts', desc: 'Ganador correcto (pero no el resultado exacto)', color: 'text-amber-600' },
                { pts: '5 pts', desc: 'Resultado exacto a 90 minutos', color: 'text-green-600' },
                { pts: '5.5 pts', desc: 'Exacto a 90 min + predijo prórroga + ganador en prórroga (marcador ET no exacto)', color: 'text-green-600' },
                { pts: '6 pts', desc: 'Exacto a 90 min + marcador exacto en prórroga', color: 'text-green-600' },
                { pts: '7 pts', desc: 'Exacto a 90 min + ganador correcto en penaltis', color: 'text-green-600' },
                { pts: '7.5 pts', desc: 'Exacto a 90 min + predijo prórroga (no exacta) + ganador en penaltis', color: 'text-green-600' },
                { pts: '8 pts', desc: 'Exacto a 90 min + prórroga exacta + ganador en penaltis', color: 'text-green-600 font-semibold' },
              ].map(({ pts, desc, color }) => (
                <div key={pts} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/50">
                  <span className={`text-sm font-bold min-w-[52px] ${color}`}>{pts}</span>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Multiplicadores por ronda */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Multiplicador por ronda</h3>
            <div className="space-y-2">
              {[
                { ronda: 'Dieciseisavos', mult: '×1' },
                { ronda: 'Octavos', mult: '×1.25' },
                { ronda: 'Cuartos', mult: '×1.5' },
                { ronda: 'Semifinales', mult: '×1.75' },
                { ronda: 'Tercer puesto', mult: '×1.75' },
                { ronda: 'Final', mult: '×2' },
              ].map(({ ronda, mult }) => (
                <div key={ronda} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">{ronda}</span>
                  <span className="text-sm font-bold text-green-700">{mult}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ejemplo: acertar el ganador en una final son 3×2 = 6 pts</p>
          </div>

          {/* Notas */}
          <div className="text-xs text-muted-foreground space-y-1.5 border-t border-border pt-4">
            <p>• Los bonos de prórroga y penaltis solo cuentan si también acertaste el resultado exacto a 90 min.</p>
            <p>• Una vez enviada la porra, no se puede modificar.</p>
            <p>• La clasificación se actualiza automáticamente tras cada resultado.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export function TopBar({ title, profile }: TopBarProps) {
  const router = useRouter()
  const [rulesOpen, setRulesOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-sm">{title}</span>
          <button
            onClick={() => setRulesOpen(true)}
            className="ml-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Reglas
          </button>
        </div>
        <div className="flex items-center gap-1">
          {profile?.is_admin && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Shield className="h-4 w-4 text-yellow-500" />
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </>
  )
}
