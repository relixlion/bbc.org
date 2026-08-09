import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('community_posts')
    .select('*, user:users(phone)')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { image_url, amount_shown } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('community_posts')
    .insert({ user_id: session.id, image_url, amount_shown, status: 'visible' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
