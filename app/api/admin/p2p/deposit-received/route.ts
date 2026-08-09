import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { trade_id } = await req.json()
    if (!trade_id) return NextResponse.json({ error: 'trade_id required' }, { status: 400 })

    const { data: trade } = await supabaseAdmin
      .from('p2p_trades')
      .select('*')
      .eq('id', trade_id)
      .single()

    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    if (trade.type !== 'deposit') return NextResponse.json({ error: 'Not a deposit trade' }, { status: 400 })
    if (trade.status === 'settled') return NextResponse.json({ error: 'Already settled' }, { status: 400 })

    // Credit user wallet
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('wallet_balance')
      .eq('id', trade.user_id)
      .single()

    await supabaseAdmin
      .from('users')
      .update({ wallet_balance: (user?.wallet_balance ?? 0) + trade.naira_amount })
      .eq('id', trade.user_id)

    await supabaseAdmin.from('transactions').insert({
      user_id: trade.user_id,
      type: 'p2p_deposit',
      amount: trade.naira_amount,
      direction: 'credit',
      note: `P2P deposit confirmed by admin — ₦${trade.naira_amount.toLocaleString()}`,
    })

    await supabaseAdmin.from('p2p_trades').update({
      status: 'settled',
      settled_at: new Date().toISOString(),
    }).eq('id', trade_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}