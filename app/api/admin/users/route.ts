import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.is_admin) return null
  return session
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  let query = supabaseAdmin
    .from('users')
    .select('id, phone, tier, wallet_balance, total_invested, is_admin, created_at, referral_code')
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('phone', `%${search}%`)

  const { data } = await query
  return NextResponse.json(data ?? [])
}
