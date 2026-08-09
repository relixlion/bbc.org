import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.is_admin) return null
  return session
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('withdrawals')
    .select('*, user:users(phone, tier)')
    .order('requested_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status, admin_note } = await req.json()

  const updates: Record<string, unknown> = {
    status,
    admin_note: admin_note ?? null,
    processed_at: new Date().toISOString(),
  }

  const { data: wd } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('id', id)
    .single()

  if (!wd) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If rejecting — refund wallet
  if (status === 'rejected' && wd.status === 'pending') {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('wallet_balance')
      .eq('id', wd.user_id)
      .single()

    await supabaseAdmin
      .from('users')
      .update({ wallet_balance: (user?.wallet_balance ?? 0) + wd.amount })
      .eq('id', wd.user_id)

    await supabaseAdmin.from('transactions').insert({
      user_id: wd.user_id,
      type: 'withdrawal_refund',
      amount: wd.amount,
      direction: 'credit',
      note: `Withdrawal rejected — refunded ₦${wd.amount}`,
    })
  }

  await supabaseAdmin.from('withdrawals').update(updates).eq('id', id)
  return NextResponse.json({ success: true })
}
