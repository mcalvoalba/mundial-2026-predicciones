'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center gap-4">
      <h2 className="text-lg font-semibold text-destructive">Algo ha salido mal</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        {error.message || 'Error inesperado. Inténtalo de nuevo.'}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline" size="sm">
          Reintentar
        </Button>
        <Button onClick={() => window.location.href = '/login'} size="sm">
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}
