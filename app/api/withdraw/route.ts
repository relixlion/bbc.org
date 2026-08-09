import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getSettings, debitWallet } from '@/lib/wallet'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { amount } = await req.json()

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.id)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!user.bank_name || !user.account_number) {
      return NextResponse.json({ error: 'Add a bank account first' }, { status: 400 })
    }

    const settings = await getSettings()
    const thresholds = settings.withdrawal_thresholds as Array<{ amount: number; days: string[] }> ?? []
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    const match = thresholds.find(t => t.amount === amount && t.days.includes(today))
    if (!match) {
      return NextResponse.json({
        error: 'This amount is not available for withdrawal today',
      }, { status: 400 })
    }

    // Check balance
    if (user.wallet_balance < amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 })
    }

    // Debit wallet and create withdrawal request
    await debitWallet(user.id, amount, 'withdrawal_request', `Withdrawal request — ₦${amount}`)

    await supabaseAdmin
      .from('users')
      .update({ wallet_balance: user.wallet_balance - amount })
      .eq('id', user.id)

    const { data: withdrawal } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        bank_name: user.bank_name,
        account_number: user.account_number,
        account_name: user.account_name,
        status: 'pending',
      })
      .select()
      .single()

    return NextResponse.json({ success: true, withdrawal })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('user_id', session.id)
    .order('requested_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
