import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getVendorSession } from '@/lib/vendor-auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const vendor = await getVendorSession()
  if (!session && !vendor) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: trade } = await supabaseAdmin
    .from('p2p_trades')
    .select('*, vendor:vendors(name,bank_name,account_number,account_name,usdt_address), user:users(phone,bank_name,account_number,account_name)')
    .eq('id', id)
    .single()

  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

  const { data: messages } = await supabaseAdmin
    .from('trade_messages')
    .select('*')
    .eq('trade_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ trade, messages: messages ?? [] })
}
