import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { setVendorSession, clearVendorSession } from '@/lib/vendor-auth'

export async function POST(req: NextRequest) {
  const { phone, password, action } = await req.json()

  if (action === 'logout') {
    await clearVendorSession()
    return NextResponse.json({ success: true })
  }

  const { data: vendor } = await supabaseAdmin
    .from('vendors').select('*').eq('phone', phone).single()

  if (!vendor) return NextResponse.json({ error: 'Phone not found' }, { status: 401 })
  if (!vendor.is_active) return NextResponse.json({ error: 'Account inactive' }, { status: 403 })

  const valid = await bcrypt.compare(password, vendor.password_hash)
  if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })

  await setVendorSession({ id: vendor.id, phone: vendor.phone, name: vendor.name, is_vendor: true })
  return NextResponse.json({ success: true, vendor: { id: vendor.id, name: vendor.name } })
}
