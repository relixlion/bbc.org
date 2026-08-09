import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.is_admin) return null
  return session
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id, amount, label } = await req.json()

  if (!user_id || !amount || amount <= 0) {
    return NextResponse.json({ error: 'user_id and amount required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('rewards').insert({
    user_id,
    type: 'admin_gift',
    amount,
    label: label ?? 'Admin gift',
    status: 'pending',
    task_required: false,
    task_completed: false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
