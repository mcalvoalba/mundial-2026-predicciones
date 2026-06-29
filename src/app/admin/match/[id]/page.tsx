import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AdminMatchForm } from '@/components/admin/AdminMatchForm'
import type { Match } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminMatchPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (!match) notFound()

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-semibold mb-4">
        Partido {match.match_number}: {match.home_team || match.home_seed || '?'} vs {match.away_team || match.away_seed || '?'}
      </h1>
      <AdminMatchForm match={match as Match} />
    </div>
  )
}
