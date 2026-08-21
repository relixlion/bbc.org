import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/wallet'
import { todayNigeria, isSundayNigeria, endOfDayNigeria } from '@/lib/time'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const today = todayNigeria()

    // Check already checked in
    const { data: existing } = await supabaseAdmin
      .from('checkin_log')
      .select('id')
      .eq('user_id', session.id)
      .eq('checked_in_at', today)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
    }

    const settings = await getSettings()
    const checkinAmount = Number(settings.checkin_amount ?? 80)

    // Sunday — no task gate, reward is free to claim
    const isSunday = isSundayNigeria()

    // Get checkin task (skip on Sundays)
    let task = null
    if (!isSunday) {
      const { data: t } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('type', 'checkin')
        .eq('is_active', true)
        .single()
      task = t ?? null
    }

    // Log check-in
    await supabaseAdmin.from('checkin_log').insert({
      user_id: session.id,
      checked_in_at: today,
    })

    // Expire any previous unclaimed checkin rewards
    await supabaseAdmin
      .from('rewards')
      .update({ status: 'expired' })
      .eq('user_id', session.id)
      .eq('type', 'checkin')
      .eq('status', 'pending')
      .lt('created_at', today)

    // Create reward only — wallet credit happens at claim time
    const expiresAt = endOfDayNigeria()

    await supabaseAdmin.from('rewards').insert({
      user_id: session.id,
      type: 'checkin',
      amount: checkinAmount,
      label: `Daily check-in · ${today}`,
      status: 'pending',
      task_required: !!task,
      task_completed: false,
      expires_at: expiresAt.toISOString(),
    })

    return NextResponse.json({ success: true, amount: checkinAmount, task: task ?? null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const today = todayNigeria()
  const { data: existing } = await supabaseAdmin
    .from('checkin_log')
    .select('id')
    .eq('user_id', session.id)
    .eq('checked_in_at', today)
    .single()

  // Get week streak using Nigeria time
  const nowNg = new Date(Date.now() + 60 * 60 * 1000)
  const startOfWeek = new Date(nowNg)
  startOfWeek.setUTCDate(nowNg.getUTCDate() - nowNg.getUTCDay())
  const { data: weekLogs } = await supabaseAdmin
    .from('checkin_log')
    .select('checked_in_at')
    .eq('user_id', session.id)
    .gte('checked_in_at', startOfWeek.toISOString().split('T')[0])

  return NextResponse.json({
    checked_in_today: !!existing,
    week_logs: weekLogs?.map((l) => l.checked_in_at) ?? [],
  })
}
