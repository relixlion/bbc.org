import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.is_admin) return null
  return session
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, status } = await req.json()
  await supabaseAdmin.from('community_posts').update({ status }).eq('id', id)
  return NextResponse.json({ success: true })
}
