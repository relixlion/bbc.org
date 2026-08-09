import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getVendorSession } from '@/lib/vendor-auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { data } = await supabaseAdmin
    .from('trade_messages').select('*').eq('trade_id', (await params).id).order('created_at')
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const vendorSession = await getVendorSession()
  if (!session && !vendorSession) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const form = await req.formData()
  const body = form.get('body') as string | null
  const file = form.get('file') as File | null

  let attachment_url: string | null = null
  let attachment_type: string | null = null

  if (file) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()
    const filename = `trade-${(await params).id}-${Date.now()}.${ext}`
    await supabaseAdmin.storage.from('community-posts').upload(filename, buffer, { contentType: file.type, upsert: false })
    const { data: urlData } = supabaseAdmin.storage.from('community-posts').getPublicUrl(filename)
    attachment_url = urlData.publicUrl
    attachment_type = file.type.startsWith('image/') ? 'image' : 'document'
  }

  const senderId = session?.id ?? vendorSession!.id
  const senderRole = session ? (session.is_admin ? 'admin' : 'user') : 'vendor'

  const { data, error } = await supabaseAdmin.from('trade_messages').insert({
    trade_id: (await params).id, sender_role: senderRole, sender_id: senderId,
    body: body ?? null, attachment_url, attachment_type,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
