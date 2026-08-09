import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { bank_name, account_number, bank_code } = await req.json()

    if (!bank_name || !account_number || account_number.length !== 10) {
      return NextResponse.json({ error: 'Enter a valid 10-digit account number' }, { status: 400 })
    }

    // Verify via Paystack
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    )
    const result = await res.json()

    if (!result.status || !result.data?.account_name) {
      return NextResponse.json({ error: 'Could not verify account. Check details and try again.' }, { status: 400 })
    }

    const account_name = result.data.account_name

    await supabaseAdmin
      .from('users')
      .update({ bank_name, account_number, account_name })
      .eq('id', session.id)

    return NextResponse.json({ success: true, account_name })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('bank_name, account_number, account_name')
    .eq('id', session.id)
    .single()

  return NextResponse.json(user)
}
