import { createClient } from '@/lib/supabase/server'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import type { LeaderboardEntry } from '@/lib/types'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [leaderboardRes, submissionRes] = await Promise.all([
    supabase.from('leaderboard').select('*'),
    supabase.from('bracket_submissions').select('submitted_at').eq('user_id', user?.id ?? '').single(),
  ])

  const hasSubmitted = !!(submissionRes.data?.submitted_at)

  return (
    <div className="p-4">
      <LeaderboardTable
        entries={(leaderboardRes.data ?? []) as LeaderboardEntry[]}
        currentUserId={user?.id ?? ''}
        hasSubmitted={hasSubmitted}
      />
    </div>
  )
}
