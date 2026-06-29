'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

interface TopBarProps {
  title: string
  profile?: Profile | null
}

export function TopBar({ title, profile }: TopBarProps) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-green-600" />
        <span className="font-semibold text-sm">{title}</span>
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
  )
}
