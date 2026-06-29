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

  // Deadline: 18:55 hora española (CEST = UTC+2) → 16:55 UTC
  const deadline = process.env.DEADLINE_ISO ?? process.env.NEXT_PUBLIC_DEADLINE_ISO ?? '2026-06-29T16:55:00Z'
  const isDeadlinePassed = new Date() >= new Date(deadline)
  const hasSubmitted = !!(submissionRes.data?.submitted_at)

  return (
    <BracketClient
      userId={user.id}
      matches={(matchesRes.data ?? []) as Match[]}
      existingPredictions={(predictionsRes.data ?? []) as Prediction[]}
      isLocked={isDeadlinePassed}
      hasSubmitted={hasSubmitted}
      deadlineISO={deadline}
    />
  )
}
