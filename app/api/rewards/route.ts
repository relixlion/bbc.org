import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { accrueAllDailyRewards, accrueMaturedFixedRewards } from '@/lib/rewards'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Accrue daily rewards on fetch
  await accrueAllDailyRewards()
  await accrueMaturedFixedRewards()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const { data, error } = await supabaseAdmin
    .from('rewards')
    .select('*')
    .eq('user_id', session.id)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
