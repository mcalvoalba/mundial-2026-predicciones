'use client'

import { useState } from 'react'
import { SplashScreen } from './SplashScreen'

export function SplashShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </>
  )
}
