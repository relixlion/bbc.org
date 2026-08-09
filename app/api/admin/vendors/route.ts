import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getSession()
  return session?.is_admin ? session : null
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data } = await supabaseAdmin.from('vendors').select('id,name,phone,bank_name,account_number,account_name,usdt_address,min_limit,max_limit,is_active,created_at,role').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const password_hash = await bcrypt.hash(body.password, 12)
  const { data, error } = await supabaseAdmin.from('vendors').insert({ ...body, password_hash }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, password, ...rest } = await req.json()
  const updates: Record<string, unknown> = { ...rest }
  if (password) updates.password_hash = await bcrypt.hash(password, 12)
  const { data, error } = await supabaseAdmin.from('vendors').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
