import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let q = supabaseAdmin.from('p2p_trades').select('*, user:users(phone), vendor:vendors(name,phone)').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data } = await q
  return NextResponse.json(data ?? [])
}
