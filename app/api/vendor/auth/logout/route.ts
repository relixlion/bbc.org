import { NextResponse } from 'next/server'
import { clearVendorSession } from '@/lib/vendor-auth'

export async function POST() {
  await clearVendorSession()
  return NextResponse.redirect(new URL('/vendor/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
}