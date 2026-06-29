'use client'

import { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center gap-4">
      <h2 className="text-xl font-bold">Error</h2>
      <p className="text-sm text-gray-600 max-w-sm">
        {error.message || 'Error inesperado.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
      >
        Reintentar
      </button>
      <a href="/login" className="text-sm text-blue-600 underline">
        Volver al inicio
      </a>
    </div>
  )
}
