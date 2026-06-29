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

  const deadline = process.env.NEXT_PUBLIC_DEADLINE_ISO
  const isDeadlinePassed = deadline ? new Date() >= new Date(deadline) : false

  return (
    <BracketClient
      userId={user.id}
      matches={(matchesRes.data ?? []) as Match[]}
      existingPredictions={(predictionsRes.data ?? []) as Prediction[]}
      isLocked={(submissionRes.data?.is_locked ?? false) || isDeadlinePassed}
      deadlineISO={deadline ?? null}
    />
  )
}
