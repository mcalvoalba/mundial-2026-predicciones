'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) { setError('Introduce tu nombre'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? '',
            display_name: displayName.trim(),
            is_admin: user.email === 'marcoscalvohovart@gmail.com',
          },
          { onConflict: 'id' }
        )

      if (upsertError) throw upsertError
      router.push('/bracket')
      router.refresh()
    } catch (err: unknown) {
      // Supabase errors are plain objects with a .message field (not instanceof Error)
      const msg = err instanceof Error
        ? err.message
        : (err as Record<string, unknown>)?.message as string | undefined
      setError(msg ?? 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-950 to-green-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
          <CardTitle>¿Cómo te llamas?</CardTitle>
          <CardDescription>
            Elige el nombre con el que aparecerás en la clasificación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Tu nombre / apodo</Label>
              <Input
                id="name"
                placeholder="Ej: Marco, El Crack, Pelé..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Guardando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
