import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/shared/BottomNav'
import { TopBar } from '@/components/shared/TopBar'
import type { Profile } from '@/lib/types'

const PAGE_TITLES: Record<string, string> = {
  '/bracket':     'Mi Porra',
  '/leaderboard': 'Clasificación',
  '/results':     'Resultados',
  '/live':        'Cuadro Real',
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Si no tiene display_name, redirigir a registro
  if (!profile?.display_name) {
    redirect('/register')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Porra Mundial 2026" profile={profile as Profile} />
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
