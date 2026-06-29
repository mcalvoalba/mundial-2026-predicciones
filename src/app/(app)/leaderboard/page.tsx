import { createClient } from '@/lib/supabase/server'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import type { LeaderboardEntry } from '@/lib/types'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('leaderboard')
    .select('*')

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-4">
      <LeaderboardTable
        entries={(data ?? []) as LeaderboardEntry[]}
        currentUserId={user?.id ?? ''}
      />
    </div>
  )
}
