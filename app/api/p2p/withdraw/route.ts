import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { addHours } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { vendor_id, naira_amount } = await req.json()

    const [{ data: rateSetting }, { data: feeSetting }, { data: vendor }, { data: user }] = await Promise.all([
      supabaseAdmin.from('admin_settings').select('value').eq('key', 'p2p_rate').single(),
      supabaseAdmin.from('admin_settings').select('value').eq('key', 'p2p_withdraw_fee').single(),
      supabaseAdmin.from('vendors').select('*').eq('id', vendor_id).eq('is_active', true).single(),
      supabaseAdmin.from('users').select('*').eq('id', session.id).single(),
    ])

    if (!vendor) return NextResponse.json({ error: 'Vendor not available' }, { status: 404 })
    if (!user?.bank_name) return NextResponse.json({ error: 'Add a bank account first' }, { status: 400 })

    const fee = Number(feeSetting?.value ?? 10)
    const feeAmount = (naira_amount * fee) / 100
    const amountAfterFee = naira_amount - feeAmount
    const rate = Number(rateSetting?.value ?? 1600)
    const usdt_amount = Number((amountAfterFee / rate).toFixed(4))

    if (user.wallet_balance < naira_amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 })
    }

    if (naira_amount < vendor.min_amount || naira_amount > vendor.max_amount) {
      return NextResponse.json({ error: `Vendor limit: ₦${vendor.min_amount.toLocaleString()} – ₦${vendor.max_amount.toLocaleString()}` }, { status: 400 })
    }

    // Lock wallet
    await supabaseAdmin.from('users').update({ wallet_balance: user.wallet_balance - naira_amount }).eq('id', session.id)
    await supabaseAdmin.from('transactions').insert({
      user_id: session.id, type: 'withdraw_lock', amount: naira_amount,
      direction: 'debit', note: `P2P withdrawal locked — ₦${naira_amount}`
    })

    const { data: trade, error } = await supabaseAdmin.from('p2p_trades').insert({
      type: 'withdraw',
      user_id: session.id,
      vendor_id,
      naira_amount,
      usdt_amount,
      rate,
      status: 'pending',
      auto_settle_at: addHours(new Date(), 32).toISOString(),
      user_bank_name: user.bank_name,
      user_account_number: user.account_number,
      user_account_name: user.account_name,
      vendor_bank_name: vendor.bank_name,
      vendor_account_number: vendor.account_number,
      vendor_account_name: vendor.account_name,
    }).select().single()

    if (error) {
      // Refund wallet on error
      await supabaseAdmin.from('users').update({ wallet_balance: user.wallet_balance }).eq('id', session.id)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(trade)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
