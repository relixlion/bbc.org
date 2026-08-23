import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC = ['/login', '/register', '/api/settings', '/api/auth/login', '/api/auth/signup', '/api/plans', '/api/community']
const ADMIN_ONLY = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Get session
  const token = req.cookies.get('bbc_session')?.value
  const session = token ? await verifyToken(token) : null

  // No session → redirect to login
  if (!session) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin routes → must be admin
  if (ADMIN_ONLY.some(p => pathname.startsWith(p)) && !session.is_admin) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
