import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BracketClient } from './BracketClient'
import type { Match, Prediction } from '@/lib/types'

export default async function BracketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [matchesRes, predictionsRes, submissionRes] = await Promise.all([
    supabase.from('matches').select('*').order('match_number'),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('bracket_submissions').select('*').eq('user_id', user.id).single(),
  ])

  const hasSubmitted = !!(submissionRes.data?.submitted_at)

  return (
    <BracketClient
      userId={user.id}
      matches={(matchesRes.data ?? []) as Match[]}
      existingPredictions={(predictionsRes.data ?? []) as Prediction[]}
      isLocked={hasSubmitted}
      hasSubmitted={hasSubmitted}
      deadlineISO={null}
    />
  )
}
