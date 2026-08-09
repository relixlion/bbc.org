import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const today = new Date().toISOString().split('T')[0]

  // All active plans with plan details
  const { data: activePlans } = await supabaseAdmin
    .from('user_plans')
    .select('*, plan:plans(*)')
    .eq('status', 'active')
    .not('plan', 'is', null)

  // Total invested (all time)
  const { data: allPlans } = await supabaseAdmin
    .from('user_plans')
    .select('amount_paid')

  // Claimed rewards (paid out)
  const { data: claimedRewards } = await supabaseAdmin
    .from('rewards')
    .select('amount')
    .eq('status', 'claimed')

  // Pending rewards (owed but not yet claimed)
  const { data: pendingRewards } = await supabaseAdmin
    .from('rewards')
    .select('amount')
    .eq('status', 'pending')

  // Completed withdrawals
  const { data: paidWithdrawals } = await supabaseAdmin
    .from('withdrawals')
    .select('amount')
    .eq('status', 'paid')

  // Pending withdrawals
  const { data: pendingWithdrawals } = await supabaseAdmin
    .from('withdrawals')
    .select('amount')
    .eq('status', 'pending')

  // All user wallet balances
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('wallet_balance, tier')
    .eq('is_admin', false)

  // Settings for rate simulation base
  const { data: settings } = await supabaseAdmin
    .from('admin_settings')
    .select('key, value')

  const sMap: Record<string, unknown> = {}
  settings?.forEach(r => { sMap[r.key] = r.value })

  // Compute totals
  const totalInvested = allPlans?.reduce((s, p) => s + p.amount_paid, 0) ?? 0
  const totalClaimedRewards = claimedRewards?.reduce((s, r) => s + r.amount, 0) ?? 0
  const totalPendingRewards = pendingRewards?.reduce((s, r) => s + r.amount, 0) ?? 0
  const totalWithdrawn = paidWithdrawals?.reduce((s, w) => s + w.amount, 0) ?? 0
  const totalPendingWithdrawals = pendingWithdrawals?.reduce((s, w) => s + w.amount, 0) ?? 0
  const totalWalletBalance = users?.reduce((s, u) => s + u.wallet_balance, 0) ?? 0

  // Per-plan obligation projections
  const planObligations = (activePlans ?? []).map(up => {
    const plan = up.plan as {
      name: string; plan_type: string; category: string;
      daily_return: number | null; fixed_return_percent: number | null; duration_days: number
    }
    if (!plan) return null

    const endDate = new Date(up.end_date)
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))

    if (plan.plan_type === 'daily') {
      const dailyReturn = plan.daily_return ?? 0
      const remaining30 = Math.min(daysLeft, 30) * dailyReturn
      const remaining60 = Math.min(daysLeft, 60) * dailyReturn
      const remaining90 = Math.min(daysLeft, 90) * dailyReturn
      const totalRemaining = daysLeft * dailyReturn
      return { plan_name: plan.name, category: plan.category, plan_type: 'daily', days_left: daysLeft, daily_return: dailyReturn, remaining30, remaining60, remaining90, total_remaining: totalRemaining, amount_paid: up.amount_paid }
    } else {
      const fixedReturn = up.amount_paid * (1 + (plan.fixed_return_percent ?? 0) / 100)
      return { plan_name: plan.name, category: plan.category, plan_type: 'fixed', days_left: daysLeft, daily_return: 0, remaining30: daysLeft <= 30 ? fixedReturn : 0, remaining60: daysLeft <= 60 ? fixedReturn : 0, remaining90: daysLeft <= 90 ? fixedReturn : 0, total_remaining: fixedReturn, amount_paid: up.amount_paid }
    }
  }).filter(Boolean)

  const obligation30 = planObligations.reduce((s, p) => s + (p?.remaining30 ?? 0), 0)
  const obligation60 = planObligations.reduce((s, p) => s + (p?.remaining60 ?? 0), 0)
  const obligation90 = planObligations.reduce((s, p) => s + (p?.remaining90 ?? 0), 0)
  const totalObligation = planObligations.reduce((s, p) => s + (p?.total_remaining ?? 0), 0)

  // Category breakdown
  const byCategory: Record<string, { invested: number; obligation: number; count: number }> = {}
  planObligations.forEach(p => {
    if (!p) return
    if (!byCategory[p.category]) byCategory[p.category] = { invested: 0, obligation: 0, count: 0 }
    byCategory[p.category].invested += p.amount_paid
    byCategory[p.category].obligation += p.total_remaining
    byCategory[p.category].count++
  })

  // Liquidity ratio: total wallet ÷ total obligation
  const liquidityRatio = totalObligation > 0 ? (totalWalletBalance / totalObligation) : 1

  // Withdrawal pressure: pending withdrawals ÷ total wallet
  const withdrawalPressure = totalWalletBalance > 0 ? (totalPendingWithdrawals / totalWalletBalance) : 0

  return NextResponse.json({
    snapshot: {
      total_invested: totalInvested,
      total_claimed_rewards: totalClaimedRewards,
      total_pending_rewards: totalPendingRewards,
      total_withdrawn: totalWithdrawn,
      total_pending_withdrawals: totalPendingWithdrawals,
      total_wallet_balance: totalWalletBalance,
      net_position: totalInvested - totalWithdrawn,
      active_plans_count: activePlans?.length ?? 0,
    },
    obligations: {
      next_30_days: obligation30,
      next_60_days: obligation60,
      next_90_days: obligation90,
      total_remaining: totalObligation,
    },
    ratios: {
      liquidity_ratio: liquidityRatio,
      withdrawal_pressure: withdrawalPressure,
    },
    by_category: byCategory,
    plan_obligations: planObligations,
    settings: sMap,
  })
}
