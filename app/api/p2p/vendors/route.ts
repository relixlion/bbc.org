import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('vendors')
    .select('id, name, min_limit, max_limit, bank_name, account_number, account_name, usdt_address, role')
    .eq('is_active', true)
    .order('name')

  return NextResponse.json(data ?? [])
}