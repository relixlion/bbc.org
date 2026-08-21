import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { creditWallet } from '@/lib/wallet'
import { nowNigeria } from '@/lib/time'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { reward_id } = await req.json()

    const { data: reward } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('id', reward_id)
      .eq('user_id', session.id)
      .eq('status', 'pending')
      .single()

    if (!reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })

    // Check task gate
    if (reward.task_required && !reward.task_completed) {
      return NextResponse.json({ error: 'Complete the task first' }, { status: 400 })
    }

    // Get claim fee for this reward type
    const { data: feeRow } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'p2p_claim_fees')
      .single()

    const feesMap = (feeRow?.value ?? {}) as Record<string, number>
    const feePct = feesMap[reward.type] ?? 0
    const fee = Math.round((reward.amount * feePct) / 100)
    const netAmount = reward.amount - fee

    // Mark claimed
    await supabaseAdmin
      .from('rewards')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('id', reward_id)

    // Credit wallet with net amount after fee — creditWallet handles both RPC and transaction log
    await creditWallet(
      session.id,
      netAmount,
      `reward_${reward.type}`,
      reward.label ?? `${reward.type} reward claimed${fee > 0 ? ` (fee: ₦${fee})` : ''}`
    )

    return NextResponse.json({ success: true, fee, net_amount: netAmount })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
