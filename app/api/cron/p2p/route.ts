import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  const { data: expired } = await supabaseAdmin.from('p2p_trades').select('*').in('status', ['pending', 'vendor_paid']).lte('auto_settle_at', now)

  let settled = 0
  for (const trade of expired ?? []) {
    if (trade.type === 'deposit') {
      // Auto-settle deposit: credit user
      const { data: user } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', trade.user_id).single()
      await supabaseAdmin.from('users').update({ wallet_balance: (user?.wallet_balance ?? 0) + trade.naira_amount }).eq('id', trade.user_id)
      await supabaseAdmin.from('transactions').insert({ user_id: trade.user_id, type: 'p2p_deposit', amount: trade.naira_amount, direction: 'credit', note: 'P2P deposit — auto settled after 32h', reference: trade.id })
    }
    // Withdraw auto-settle: vendor assumed paid, mark settled
    await supabaseAdmin.from('p2p_trades').update({ status: 'expired', settled_at: now }).eq('id', trade.id)
    settled++
  }

  return NextResponse.json({ settled })
}
