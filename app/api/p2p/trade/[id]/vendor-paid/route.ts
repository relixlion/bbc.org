import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getVendorSession } from '@/lib/vendor-auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getVendorSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { txid } = await req.json()

  const { data: trade } = await supabaseAdmin.from('p2p_trades').select('*').eq('id', (await params).id).eq('vendor_id', session.id).single()
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (trade.status !== 'pending') return NextResponse.json({ error: 'Trade already actioned' }, { status: 400 })

  await supabaseAdmin.from('p2p_trades').update({ status: 'vendor_paid', txid: txid ?? null }).eq('id', (await params).id)
  return NextResponse.json({ success: true })
}
