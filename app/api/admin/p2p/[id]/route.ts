import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, admin_note, txid } = await req.json()
  const { data: trade } = await supabaseAdmin.from('p2p_trades').select('*').eq('id', (await params).id).single()
  if (!trade) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'credit_user') {
    // Admin confirms deposit received — credit user
    const { data: user } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', trade.user_id).single()
    await supabaseAdmin.from('users').update({ wallet_balance: (user?.wallet_balance ?? 0) + trade.naira_amount }).eq('id', trade.user_id)
    await supabaseAdmin.from('transactions').insert({ user_id: trade.user_id, type: 'p2p_deposit', amount: trade.naira_amount, direction: 'credit', note: 'P2P deposit — admin confirmed', reference: trade.id })
    await supabaseAdmin.from('p2p_trades').update({ status: 'confirmed', settled_at: new Date().toISOString(), admin_note: admin_note ?? null, txid: txid ?? trade.txid }).eq('id', (await params).id)
  } else if (action === 'force_settle_vendor') {
    // Withdraw dispute settled in vendor's favour — release locked funds to vendor (no wallet change, just mark settled)
    await supabaseAdmin.from('p2p_trades').update({ status: 'settled', settled_at: new Date().toISOString(), admin_note: admin_note ?? null }).eq('id', (await params).id)
  } else if (action === 'force_settle_user') {
    // Withdraw dispute settled in user's favour — refund locked wallet
    const { data: user } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', trade.user_id).single()
    await supabaseAdmin.from('users').update({ wallet_balance: (user?.wallet_balance ?? 0) + trade.naira_amount }).eq('id', trade.user_id)
    await supabaseAdmin.from('transactions').insert({ user_id: trade.user_id, type: 'p2p_refund', amount: trade.naira_amount, direction: 'credit', note: 'P2P withdrawal refund — dispute resolved', reference: trade.id })
    await supabaseAdmin.from('p2p_trades').update({ status: 'settled', settled_at: new Date().toISOString(), admin_note: admin_note ?? null }).eq('id', (await params).id)
  } else if (action === 'cancel') {
    if (trade.type === 'withdraw') {
      const { data: user } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', trade.user_id).single()
      await supabaseAdmin.from('users').update({ wallet_balance: (user?.wallet_balance ?? 0) + trade.naira_amount }).eq('id', trade.user_id)
    }
    await supabaseAdmin.from('p2p_trades').update({ status: 'cancelled', admin_note: admin_note ?? null }).eq('id', (await params).id)
  }

  return NextResponse.json({ success: true })
}
