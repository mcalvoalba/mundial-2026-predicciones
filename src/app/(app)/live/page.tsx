import { createClient } from '@/lib/supabase/server'
import { LiveBracketClient } from './LiveBracketClient'
import type { Match } from '@/lib/types'

export default async function LivePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('matches').select('*').order('match_number')

  return (
    <LiveBracketClient matches={(data ?? []) as Match[]} />
  )
}
