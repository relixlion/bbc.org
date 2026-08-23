'use client'
import { useState, useEffect } from 'react'
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

  const LAUNCH = new Date('2026-08-24T07:00:00Z') // 8:00 AM Nigeria = 07:00 UTC

  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, launched: false })

  useEffect(() => {
    function tick() {
      const diff = LAUNCH.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ h: 0, m: 0, s: 0, launched: true }); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ h, m, s, launched: false })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--sand)' }}>
      {/* Brand header */}
      <div style={{ background: 'var(--emerald)', padding: '3rem 1.5rem 2.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>
          B.B Cooperative
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
          Members-only investment platform
        </div>

        {/* Countdown */}
        <div style={{ marginTop: '1.5rem' }}>
          {timeLeft.launched ? (
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🎉</span>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--white)' }}>We are live!</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Official launch day — welcome to B.B Cooperative</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
                Official launch in
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {[
                  { v: pad(timeLeft.h), l: 'HRS' },
                  { v: pad(timeLeft.m), l: 'MIN' },
                  { v: pad(timeLeft.s), l: 'SEC' },
                ].map(({ v, l }, i) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</div>
                      <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginTop: '0.25rem' }}>{l}</div>
                    </div>
                    {i < 2 && <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>:</div>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.625rem' }}>
                Mon 24 Aug · 8:00 AM Nigeria time
              </div>
            </div>
          )}
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
