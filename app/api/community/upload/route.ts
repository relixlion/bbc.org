import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    const amount = form.get('amount') as string | null

    if (!file || !amount) {
      return NextResponse.json({ error: 'Image and amount required' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${session.id}-${Date.now()}.jpg`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('community-posts')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('community-posts')
      .getPublicUrl(filename)

    const image_url = urlData.publicUrl

    // Create community post
    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        user_id: session.id,
        image_url,
        amount_shown: Number(amount),
        status: 'visible',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
