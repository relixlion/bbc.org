import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getVendorSession } from '@/lib/vendor-auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const vendorSession = await getVendorSession()
  if (!session && !vendorSession) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: trade } = await supabaseAdmin.from('p2p_trades').select('*').eq('id', (await params).id).single()
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (['confirmed', 'settled', 'cancelled'].includes(trade.status)) {
    return NextResponse.json({ error: 'Cannot dispute a closed trade' }, { status: 400 })
  }

  await supabaseAdmin.from('p2p_trades').update({ status: 'disputed', dispute_opened_at: new Date().toISOString() }).eq('id', (await params).id)
  return NextResponse.json({ success: true })
}
