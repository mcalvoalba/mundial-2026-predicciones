'use client'

import { useEffect } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        perspective: '900px',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes splash-porra {
          0%   { opacity: 0; transform: translateZ(600px) rotateX(30deg); }
          20%  { opacity: 1; transform: translateZ(0px) rotateX(0deg); }
          75%  { opacity: 1; transform: translateZ(0px) rotateX(0deg); }
          100% { opacity: 0; transform: translateZ(-200px) rotateX(-15deg); }
        }
        @keyframes splash-by {
          0%   { opacity: 0; letter-spacing: 0.8em; }
          30%  { opacity: 0; letter-spacing: 0.8em; }
          50%  { opacity: 1; letter-spacing: 0.35em; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes splash-bilindo {
          0%   { opacity: 0; transform: translateZ(-400px) rotateY(90deg) scale(0.5); }
          35%  { opacity: 0; transform: translateZ(-400px) rotateY(90deg) scale(0.5); }
          65%  { opacity: 1; transform: translateZ(0px) rotateY(0deg) scale(1); }
          75%  { opacity: 1; transform: translateZ(0px) rotateY(0deg) scale(1); }
          90%  { opacity: 1; transform: translateZ(30px) rotateY(0deg) scale(1.03); }
          100% { opacity: 0; transform: translateZ(-200px) rotateY(-10deg); }
        }
        @keyframes splash-glow {
          0%   { text-shadow: 0 0 0px #16a34a; }
          65%  { text-shadow: 0 0 0px #16a34a; }
          80%  { text-shadow: 0 0 40px #16a34a, 0 0 80px #16a34a44; }
          90%  { text-shadow: 0 0 20px #16a34a; }
          100% { text-shadow: 0 0 0px #16a34a; }
        }
        .splash-porra {
          animation: splash-porra 5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-style: preserve-3d;
        }
        .splash-by {
          animation: splash-by 5s ease-in-out forwards;
        }
        .splash-bilindo {
          animation: splash-bilindo 5s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     splash-glow 5s ease-in-out forwards;
          transform-style: preserve-3d;
        }
      `}</style>

      <div style={{ textAlign: 'center', transformStyle: 'preserve-3d' }}>
        {/* PORRA */}
        <div
          className="splash-porra"
          style={{
            fontSize: 'clamp(3.5rem, 18vw, 9rem)',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '0.12em',
            lineHeight: 1,
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          PORRA
        </div>

        {/* PATROCINADA POR */}
        <div
          className="splash-by"
          style={{
            fontSize: 'clamp(0.65rem, 3.5vw, 1.1rem)',
            fontWeight: 400,
            color: '#6b7280',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginTop: '0.6rem',
            marginBottom: '0.3rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          PATROCINADA POR
        </div>

        {/* BILINDO */}
        <div
          className="splash-bilindo"
          style={{
            fontSize: 'clamp(3rem, 16vw, 8rem)',
            fontWeight: 900,
            color: '#16a34a',
            letterSpacing: '0.08em',
            lineHeight: 1,
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          BILINDO
        </div>
      </div>
    </div>
  )
}
