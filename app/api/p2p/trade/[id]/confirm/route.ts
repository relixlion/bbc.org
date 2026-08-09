import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: trade } = await supabaseAdmin.from('p2p_trades').select('*').eq('id', (await params).id).eq('user_id', session.id).single()
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (!['pending', 'vendor_paid'].includes(trade.status)) return NextResponse.json({ error: 'Trade cannot be confirmed' }, { status: 400 })

  if (trade.type === 'deposit') {
    // Credit user wallet
    const { data: user } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', session.id).single()
    await supabaseAdmin.from('users').update({ wallet_balance: (user?.wallet_balance ?? 0) + trade.naira_amount }).eq('id', session.id)
    await supabaseAdmin.from('transactions').insert({
      user_id: session.id, type: 'p2p_deposit', amount: trade.naira_amount,
      direction: 'credit', note: `P2P deposit confirmed`, reference: trade.id,
    })
  }

  await supabaseAdmin.from('p2p_trades').update({ status: 'confirmed', settled_at: new Date().toISOString() }).eq('id', (await params).id)
  return NextResponse.json({ success: true })
}
