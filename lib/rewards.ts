import { supabaseAdmin } from './supabase'
import { getSettings } from './wallet'

// Called by cron or on-demand: generate pending daily rewards for all active plans
export async function accrueAllDailyRewards() {
  const today = new Date().toISOString().split('T')[0]
  const isSunday = new Date().getDay() === 0
  if (isSunday) return { count: 0, skipped: 'sunday' }

  // Get all active daily plans not yet rewarded today
  const { data: userPlans } = await supabaseAdmin
    .from('user_plans')
    .select('*, plan:plans(*)')
    .eq('status', 'active')
    .eq('plans.plan_type', 'daily')
    .or(`last_reward_date.is.null,last_reward_date.lt.${today}`)

  if (!userPlans?.length) return { count: 0 }

  const settings = await getSettings()
  const dailyTask = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('type', 'daily_reward')
    .eq('is_active', true)
    .single()

  const taskRequired = !!dailyTask.data

  for (const up of userPlans) {
    if (!up.plan || up.plan.plan_type !== 'daily') continue

    // Check if matured
    if (new Date(up.end_date) < new Date()) {
      await supabaseAdmin
        .from('user_plans')
        .update({ status: 'matured' })
        .eq('id', up.id)
      continue
    }

    // Expire any unclaimed daily rewards from previous days
    await supabaseAdmin
      .from('rewards')
      .update({ status: 'expired' })
      .eq('user_id', up.user_id)
      .eq('type', 'daily')
      .eq('status', 'pending')
      .lt('created_at', today)

    // Create daily reward — no task on Sundays
    const expires_at = new Date()
    expires_at.setHours(23, 59, 59, 999)

    await supabaseAdmin.from('rewards').insert({
      user_id: up.user_id,
      type: 'daily',
      amount: up.plan.daily_return,
      label: `${up.plan.name} · ${today}`,
      status: 'pending',
      task_required: taskRequired,
      task_completed: false,
      source_plan_id: up.id,
      expires_at: expires_at.toISOString(),
    })

    // Update last_reward_date
    await supabaseAdmin
      .from('user_plans')
      .update({ last_reward_date: today })
      .eq('id', up.id)
  }

  return { count: userPlans.length }
}

// Accrue fixed plan maturity rewards
export async function accrueMaturedFixedRewards() {
  const today = new Date().toISOString().split('T')[0]

  const { data: matured } = await supabaseAdmin
    .from('user_plans')
    .select('*, plan:plans(*)')
    .eq('status', 'active')
    .lte('end_date', today)
    .eq('plans.plan_type', 'fixed')

  if (!matured?.length) return { count: 0 }

  for (const up of matured) {
    if (!up.plan) continue
    const totalReturn = up.amount_paid * (1 + (up.plan.fixed_return_percent / 100))

    await supabaseAdmin.from('rewards').insert({
      user_id: up.user_id,
      type: 'fixed',
      amount: totalReturn,
      label: `${up.plan.name} matured`,
      status: 'pending',
      task_required: false,
      task_completed: false,
      source_plan_id: up.id,
    })

    await supabaseAdmin
      .from('user_plans')
      .update({ status: 'matured' })
      .eq('id', up.id)
  }

  return { count: matured.length }
}

// Accrue referral commission when a plan is purchased
export async function accrueReferralCommissions(
  buyerId: string,
  purchaseAmount: number
) {
  const settings = await getSettings()
  const rates = settings.referral_rates as { l1: number; l2: number; l3: number }

  // L1: direct referrer
  const { data: buyer } = await supabaseAdmin
    .from('users')
    .select('referred_by, phone')
    .eq('id', buyerId)
    .single()

  if (!buyer?.referred_by) return

  const l1Id = buyer.referred_by
  const l1Amount = (purchaseAmount * rates.l1) / 100

  await supabaseAdmin.from('rewards').insert({
    user_id: l1Id,
    type: 'referral',
    amount: l1Amount,
    label: `L1 commission · ${maskPhone(buyer.phone)} bought a plan`,
    status: 'pending',
    task_required: false,
    task_completed: false,
  })

  // L2
  const { data: l1 } = await supabaseAdmin
    .from('users')
    .select('referred_by, phone')
    .eq('id', l1Id)
    .single()

  if (!l1?.referred_by) return

  const l2Id = l1.referred_by
  const l2Amount = (purchaseAmount * rates.l2) / 100

  await supabaseAdmin.from('rewards').insert({
    user_id: l2Id,
    type: 'referral',
    amount: l2Amount,
    label: `L2 commission · ${maskPhone(buyer.phone)} bought a plan`,
    status: 'pending',
    task_required: false,
    task_completed: false,
  })

  // L3
  const { data: l2 } = await supabaseAdmin
    .from('users')
    .select('referred_by, phone')
    .eq('id', l2Id)
    .single()

  if (!l2?.referred_by) return

  const l3Amount = (purchaseAmount * rates.l3) / 100

  await supabaseAdmin.from('rewards').insert({
    user_id: l2.referred_by,
    type: 'referral',
    amount: l3Amount,
    label: `L3 commission · ${maskPhone(buyer.phone)} bought a plan`,
    status: 'pending',
    task_required: false,
    task_completed: false,
  })
}

function maskPhone(phone: string): string {
  return phone.slice(0, 4) + '*****' + phone.slice(-3)
}
