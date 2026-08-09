import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getVendorSession } from '@/lib/vendor-auth'

export async function GET() {
  const session = await getVendorSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('p2p_trades')
    .select('*, user:users(phone, bank_name, account_number, account_name)')
    .eq('vendor_id', session.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
