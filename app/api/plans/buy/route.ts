import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { debitWallet, getSettings, computeTier } from '@/lib/wallet'
import { accrueReferralCommissions } from '@/lib/rewards'
import { addDays, format } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { plan_id } = await req.json()

    // Get plan
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    // Get current user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.id)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const price = plan.price
    const walletBalance = user.wallet_balance

    if (walletBalance < price) {
      return NextResponse.json({ error: 'Insufficient wallet balance. Please deposit funds first.' }, { status: 400 })
    }

    await debitWallet(user.id, price, 'plan_purchase', `Plan purchase — ${plan.name}`)
    const walletUsed = price

    // Create user_plan
    const startDate = new Date()
    const endDate = addDays(startDate, plan.duration_days)

    const { data: userPlan, error: upError } = await supabaseAdmin
      .from('user_plans')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount_paid: price,
        wallet_used: walletUsed,
        paystack_used: 0,
        paystack_ref: null,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        status: 'active',
      })
      .select()
      .single()

    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 })

    // Update total_invested and tier
    const newTotalInvested = user.total_invested + price
    const settings = await getSettings()
    const tiers = settings.withdrawal_tiers as Parameters<typeof computeTier>[1]
    const newTier = computeTier(newTotalInvested, tiers)

    await supabaseAdmin
      .from('users')
      .update({ total_invested: newTotalInvested, tier: newTier })
      .eq('id', user.id)

    // Accrue referral commissions
    await accrueReferralCommissions(user.id, price)

    return NextResponse.json({ success: true, user_plan: userPlan })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
