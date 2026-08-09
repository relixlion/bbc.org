import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getVendorSession } from '@/lib/vendor-auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    const vendor = await getVendorSession()
    if (!session && !vendor) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { action } = await req.json()
    const { data: trade } = await supabaseAdmin.from('p2p_trades').select('*').eq('id', id).single()
    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

    if (action === 'vendor_paid' && vendor) {
      if (trade.vendor_id !== vendor.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      await supabaseAdmin.from('p2p_trades').update({ status: 'vendor_paid' }).eq('id', id)
      return NextResponse.json({ success: true })
    }

    if (action === 'confirm_received' && session) {
      if (trade.user_id !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      await supabaseAdmin.from('p2p_trades').update({ status: 'settled', settled_at: new Date().toISOString() }).eq('id', id)
      if (trade.type === 'deposit') {
        const { data: user } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', session.id).single()
        await supabaseAdmin.from('users').update({ wallet_balance: (user?.wallet_balance ?? 0) + trade.naira_amount }).eq('id', session.id)
        await supabaseAdmin.from('transactions').insert({ user_id: session.id, type: 'p2p_deposit', amount: trade.naira_amount, direction: 'credit', note: 'P2P deposit confirmed' })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'dispute' && session) {
      if (trade.user_id !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      await supabaseAdmin.from('p2p_trades').update({ status: 'disputed', dispute_opened_at: new Date().toISOString() }).eq('id', id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
