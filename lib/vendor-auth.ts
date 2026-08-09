import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE = 'bbc_vendor_session'

export interface VendorSession {
  id: string
  phone: string
  name: string
  is_vendor: true
}

export async function signVendorToken(payload: VendorSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(secret)
}

export async function getVendorSession(): Promise<VendorSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as VendorSession
  } catch { return null }
}

export async function setVendorSession(vendor: VendorSession) {
  const token = await signVendorToken(vendor)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export async function clearVendorSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}
