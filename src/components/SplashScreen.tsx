'use client'

import { useEffect } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        gap: 0,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&display=swap');

        @keyframes sp-fade-up {
          0%   { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-line-grow {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes sp-logo-in {
          0%   { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sp-exit {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        .sp-wrapper {
          animation: sp-exit 0.7s ease-in 4.8s forwards;
        }
        .sp-sponsored {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-style: italic;
          font-size: clamp(0.7rem, 3.5vw, 0.95rem);
          color: #6b7280;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          opacity: 0;
          animation: sp-fade-up 0.9s ease-out 0.3s forwards;
        }
        .sp-line {
          width: clamp(120px, 40vw, 220px);
          height: 1px;
          background: #2d2d2d;
          margin: 1.2rem auto;
          transform-origin: center;
          transform: scaleX(0);
          animation: sp-line-grow 0.8s ease-out 0.9s forwards;
        }
        .sp-logo-b {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-size: clamp(7rem, 32vw, 14rem);
          color: #ffffff;
          line-height: 0.85;
          letter-spacing: -0.04em;
          opacity: 0;
          animation: sp-logo-in 1.1s cubic-bezier(0.16, 1, 0.3, 1) 1.4s forwards;
        }
        .sp-bilindo {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-size: clamp(1.6rem, 8vw, 3.2rem);
          color: #ffffff;
          letter-spacing: 0.55em;
          padding-left: 0.55em; /* compensate letter-spacing on last char */
          margin-top: 0.5rem;
          opacity: 0;
          animation: sp-fade-up 1s ease-out 2.4s forwards;
        }
        .sp-line2 {
          width: clamp(120px, 40vw, 220px);
          height: 1px;
          background: #2d2d2d;
          margin: 1.3rem auto 0;
          transform-origin: center;
          transform: scaleX(0);
          animation: sp-line-grow 0.8s ease-out 3.2s forwards;
        }
      `}</style>

      <div className="sp-wrapper" style={{ textAlign: 'center' }}>
        <p className="sp-sponsored">Patrocinada por</p>

        <div className="sp-line" />

        <div className="sp-logo-b">B</div>
        <div className="sp-bilindo">BiLiNDO</div>

        <div className="sp-line2" />
      </div>
    </div>
  )
}
