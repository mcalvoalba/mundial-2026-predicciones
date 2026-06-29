'use client'

import { useState, useEffect } from 'react'
import { SplashScreen } from './SplashScreen'

export function SplashShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('splash-shown')
    if (!seen) {
      sessionStorage.setItem('splash-shown', '1')
      setShowSplash(true)
    }
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </>
  )
}
