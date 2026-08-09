import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('admin_settings')
    .select('key, value')
    .in('key', ['checkin_amount', 'withdrawal_thresholds', 'p2p_withdrawal_fee_percent', 'referral_rates'])

  const map: Record<string, unknown> = {}
  data?.forEach(r => { map[r.key] = r.value })
  return NextResponse.json(map)
}