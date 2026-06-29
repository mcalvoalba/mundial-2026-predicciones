import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BracketTree } from '@/components/bracket/BracketTree'
import { predictionsToMap } from '@/lib/bracket'
import type { Match, Prediction } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function OtherUserBracketPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: targetUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Solo se puede ver la porra ajena si ya enviaste la tuya
  const { data: mySubmission } = await supabase
    .from('bracket_submissions')
    .select('submitted_at')
    .eq('user_id', user.id)
    .single()

  if (!mySubmission?.submitted_at) redirect('/bracket')

  const [matchesRes, predictionsRes, profileRes] = await Promise.all([
    supabase.from('matches').select('*').order('match_number'),
    supabase.from('predictions').select('*').eq('user_id', targetUserId),
    supabase.from('profiles').select('display_name').eq('id', targetUserId).single(),
  ])

  const matches = (matchesRes.data ?? []) as Match[]
  const predictions = (predictionsRes.data ?? []) as Prediction[]
  const draft = predictionsToMap(predictions)
  const displayName = profileRes.data?.display_name ?? 'Usuario'

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <Link href="/leaderboard" className="p-1 -ml-1 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-sm font-semibold">Porra de {displayName}</p>
          <p className="text-xs text-muted-foreground">Solo lectura</p>
        </div>
      </div>
      <BracketTree
        matches={matches}
        draft={draft}
        mode="view"
      />
    </div>
  )
}
