import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { addHours } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { vendor_id, naira_amount } = await req.json()

    if (!vendor_id || !naira_amount || naira_amount <= 0) {
      return NextResponse.json({ error: 'Vendor and amount required' }, { status: 400 })
    }

    // Get rate and vendor
    const [{ data: rateSetting }, { data: vendor }, { data: user }] = await Promise.all([
      supabaseAdmin.from('admin_settings').select('value').eq('key', 'p2p_rate').single(),
      supabaseAdmin.from('vendors').select('*').eq('id', vendor_id).eq('is_active', true).single(),
      supabaseAdmin.from('users').select('bank_name, account_number, account_name').eq('id', session.id).single(),
    ])

    if (!vendor) return NextResponse.json({ error: 'Vendor not available' }, { status: 404 })

    const rate = Number(rateSetting?.value ?? 1600)
    const usdt_amount = Number((naira_amount / rate).toFixed(4))

    if (naira_amount < vendor.min_amount || naira_amount > vendor.max_amount) {
      return NextResponse.json({ error: `Vendor limit: ₦${vendor.min_amount.toLocaleString()} – ₦${vendor.max_amount.toLocaleString()}` }, { status: 400 })
    }

    const { data: trade, error } = await supabaseAdmin.from('p2p_trades').insert({
      type: 'deposit',
      user_id: session.id,
      vendor_id,
      naira_amount,
      usdt_amount,
      rate,
      status: 'pending',
      auto_settle_at: addHours(new Date(), 32).toISOString(),
      vendor_bank_name: vendor.bank_name,
      vendor_account_number: vendor.account_number,
      vendor_account_name: vendor.account_name,
      user_bank_name: user?.bank_name,
      user_account_number: user?.account_number,
      user_account_name: user?.account_name,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(trade)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
