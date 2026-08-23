import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getVendorSession } from '@/lib/vendor-auth'

export async function GET() {
  const session = await getSession()
  const vendor = await getVendorSession()

  // invite_codes is always public — needed on register page before any session exists
  const { data: publicData } = await supabaseAdmin
    .from('admin_settings')
    .select('key, value')
    .in('key', ['invite_codes'])

  const publicMap: Record<string, unknown> = {}
  publicData?.forEach(r => { publicMap[r.key] = r.value })

  // Other settings require auth
  if (!session && !vendor) {
    return NextResponse.json(publicMap)
  }

  const { data } = await supabaseAdmin
    .from('admin_settings')
    .select('key, value')
    .in('key', ['checkin_amount', 'withdrawal_thresholds', 'p2p_withdrawal_fee_percent', 'referral_rates', 'p2p_rate', 'invite_codes'])

  const map: Record<string, unknown> = {}
  data?.forEach(r => { map[r.key] = r.value })
  return NextResponse.json(map)
}