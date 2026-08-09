import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getVendorSession } from '@/lib/vendor-auth'

export async function GET() {
  const session = await getVendorSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('vendor_payout_requests')
    .select('*')
    .eq('vendor_id', session.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getVendorSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { usdt_amount, usdt_address, note } = await req.json()

  if (!usdt_amount || usdt_amount <= 0) {
    return NextResponse.json({ error: 'Invalid USDT amount' }, { status: 400 })
  }
  if (!usdt_address) {
    return NextResponse.json({ error: 'USDT wallet address required' }, { status: 400 })
  }

  const { data: rateRow } = await supabaseAdmin
    .from('admin_settings')
    .select('value')
    .eq('key', 'p2p_rate')
    .single()

  const rate = Number(rateRow?.value ?? 1600)
  const naira_equivalent = usdt_amount * rate

  const { data, error } = await supabaseAdmin
    .from('vendor_payout_requests')
    .insert({
      vendor_id: session.id,
      vendor_name: session.name,
      usdt_amount,
      usdt_address,
      naira_equivalent,
      rate,
      note: note ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}