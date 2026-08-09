import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { startOfWeek, format } from 'date-fns'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const isSunday = new Date().getDay() === 0
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

    // Get all active plans for this user
    const { data: activePlans } = await supabaseAdmin
      .from('user_plans')
      .select('*, plan:plans(id, name, weekly_salary)')
      .eq('user_id', session.id)
      .eq('status', 'active')

    if (!activePlans?.length) {
      return NextResponse.json({ error: 'No active plans' }, { status: 400 })
    }

    // Get task (skip on Sundays)
    let task = null
    if (!isSunday) {
      const { data: t } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('type', 'weekly_salary')
        .eq('is_active', true)
        .single()
      task = t ?? null
    }

    let created = 0
    for (const up of activePlans) {
      const plan = up.plan as { id: string; name: string; weekly_salary?: number } | null
      if (!plan) continue

      const amount = plan.weekly_salary ?? 0
      if (amount <= 0) continue

      // Check if salary already claimed for this plan this week
      const { data: existing } = await supabaseAdmin
        .from('rewards')
        .select('id')
        .eq('user_id', session.id)
        .eq('type', 'salary')
        .eq('source_plan_id', up.id)
        .gte('created_at', weekStart)
        .maybeSingle()

      if (existing) continue

      await supabaseAdmin.from('rewards').insert({
        user_id: session.id,
        type: 'salary',
        amount,
        label: `Weekly salary · ${plan.name} · w/c ${weekStart}`,
        status: 'pending',
        task_required: !!task,
        task_completed: false,
        source_plan_id: up.id,
      })
      created++
    }

    if (created === 0) {
      return NextResponse.json({ error: 'Weekly salary already claimed for all active plans this week' }, { status: 400 })
    }

    return NextResponse.json({ success: true, plans_credited: created, task: task ?? null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}