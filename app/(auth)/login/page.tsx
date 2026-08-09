'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GreenButton, Input, Alert } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(data.user.is_admin ? '/admin/dashboard' : '/home')
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--sand)' }}>
      {/* Brand header */}
      <div style={{ background: 'var(--emerald)', padding: '3rem 1.5rem 2.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>
          B.B Cooperative
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
          Members-only investment platform
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="t-heading" style={{ marginBottom: '0.25rem' }}>Sign in</div>
          <div className="t-caption">Enter your phone number and password</div>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <Input label="Phone number" type="tel" placeholder="08012345678" maxLength={11}
          value={phone} onChange={e => setPhone(e.target.value)} />
        <Input label="Password" type="password" placeholder="Your password"
          value={password} onChange={e => setPassword(e.target.value)} />

        <GreenButton onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in…' : 'Continue'}
        </GreenButton>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <span className="t-caption">New member? </span>
          <Link href="/register" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emerald)', textDecoration: 'none' }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
