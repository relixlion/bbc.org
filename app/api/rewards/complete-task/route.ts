import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

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
    if (!reward.task_required) return NextResponse.json({ error: 'No task required' }, { status: 400 })

    await supabaseAdmin
      .from('rewards')
      .update({ task_completed: true })
      .eq('id', reward_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
