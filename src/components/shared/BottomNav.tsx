'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, BarChart3, CheckSquare, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/bracket',     label: 'Mi Porra',      icon: Trophy },
  { href: '/leaderboard', label: 'Clasificación',  icon: BarChart3 },
  { href: '/results',     label: 'Resultados',     icon: CheckSquare },
  { href: '/live',        label: 'Cuadro',         icon: Globe },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border h-16 safe-area-pb">
      <div className="flex h-full">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                active ? 'text-green-600' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-green-600')} />
              <span className="text-[10px]">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
