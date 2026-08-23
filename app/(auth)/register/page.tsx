'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { GreenButton, Input, Alert } from '@/components/ui'

const LAUNCH = new Date('2026-08-24T11:00:00Z')

function Countdown() {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number; launched: boolean } | null>(null)

  useEffect(() => {
    function tick() {
      const diff = LAUNCH.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ h: 0, m: 0, s: 0, launched: true }); return }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        launched: false,
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  if (!timeLeft || timeLeft.launched) return null

  return (
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
        Mon 24 Aug · 12:00 noon Nigeria time
      </div>
    </div>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ phone: '', password: '', confirm: '', referral_code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [adminCodes, setAdminCodes] = useState<{ code1: string; code2: string }>({ code1: '', code2: '' })
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    // Pre-fill code from URL
    const code = searchParams.get('code')
    if (code) setForm(p => ({ ...p, referral_code: code.toUpperCase() }))

    // Fetch admin invite codes
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s.invite_codes) setAdminCodes(s.invite_codes)
    })
  }, [])

  function selectAdminCode(code: string) {
    setForm(p => ({ ...p, referral_code: code }))
  }

  async function handleRegister() {
    setError('')
    if (!form.referral_code.trim()) {
      setError('You must use a referral link or enter a valid code')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          password: form.password,
          referral_code: form.referral_code.trim().toUpperCase(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/home')
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  const hasAdminCodes = adminCodes.code1 || adminCodes.code2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--sand)' }}>
      <div style={{ background: 'var(--emerald)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '1.5rem' }}>
          B.B Cooperative
        </div>
        <Countdown />
      </div>

      <div style={{ flex: 1, padding: '2rem 1.5rem' }}>
        {/* Welcome bonus */}
        <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-dim)', borderRadius: 'var(--r-md)', padding: '0.875rem 1rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7A5500' }}>₦1,000 welcome credit</div>
            <div style={{ fontSize: '0.75rem', color: '#9A6A00', marginTop: '1px' }}>Added to your wallet on signup</div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="t-heading" style={{ marginBottom: '0.25rem' }}>Create account</div>
          <div className="t-caption">Your phone number is your login</div>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {/* Referral code section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
            Referral code <span style={{ color: 'var(--danger)' }}>*</span>
          </div>

          {hasAdminCodes && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginBottom: '0.5rem' }}>Quick select</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {adminCodes.code1 && (
                  <button onClick={() => selectAdminCode(adminCodes.code1)}
                    style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: 'var(--r-sm)', border: form.referral_code === adminCodes.code1 ? '2px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: form.referral_code === adminCodes.code1 ? 'var(--emerald-bg)' : 'var(--white)', fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 700, color: form.referral_code === adminCodes.code1 ? 'var(--emerald)' : 'var(--ink)', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'center' }}>
                    {adminCodes.code1}
                  </button>
                )}
                {adminCodes.code2 && (
                  <button onClick={() => selectAdminCode(adminCodes.code2)}
                    style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: 'var(--r-sm)', border: form.referral_code === adminCodes.code2 ? '2px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: form.referral_code === adminCodes.code2 ? 'var(--emerald-bg)' : 'var(--white)', fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 700, color: form.referral_code === adminCodes.code2 ? 'var(--emerald)' : 'var(--ink)', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'center' }}>
                    {adminCodes.code2}
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Or enter referral code"
              value={form.referral_code}
              onChange={e => setForm(p => ({ ...p, referral_code: e.target.value.toUpperCase() }))}
              style={{ width: '100%', padding: '0.875rem 2.5rem 0.875rem 1rem', borderRadius: 'var(--r-sm)', border: form.referral_code ? '1.5px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: 'var(--white)', fontSize: '0.9375rem', fontFamily: 'monospace', letterSpacing: '0.05em', color: 'var(--ink)', outline: 'none', transition: 'border-color 0.12s' }}
            />
            {form.referral_code && (
              <div style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            )}
          </div>
        </div>

        <Input label="Phone number" type="tel" placeholder="08012345678" maxLength={11} value={form.phone} onChange={f('phone')} />
        <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={f('password')} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" value={form.confirm} onChange={f('confirm')} />

        <GreenButton onClick={handleRegister} disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </GreenButton>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingBottom: '2rem' }}>
          <span className="t-caption">Already a member? </span>
          <Link href="/login" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emerald)', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--sand)' }} />}>
      <RegisterForm />
    </Suspense>
  )
}