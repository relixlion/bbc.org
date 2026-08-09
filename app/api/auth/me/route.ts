import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { data: user } = await supabaseAdmin.from('users').select('id,phone,tier,wallet_balance,total_invested,bank_name,account_number,account_name,referral_code').eq('id', session.id).single()
  return NextResponse.json(user)
}
