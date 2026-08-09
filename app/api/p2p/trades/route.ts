import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getVendorSession } from '@/lib/vendor-auth'

export async function GET() {
  const session = await getSession()
  const vendor = await getVendorSession()

  if (session) {
    const { data } = await supabaseAdmin
      .from('p2p_trades')
      .select('*, vendor:vendors(name)')
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
    return NextResponse.json(data ?? [])
  }

  if (vendor) {
    const { data } = await supabaseAdmin
      .from('p2p_trades')
      .select('*, user:users(phone, bank_name, account_number, account_name)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
    return NextResponse.json(data ?? [])
  }

  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
}