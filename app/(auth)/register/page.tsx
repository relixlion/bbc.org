'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GreenButton, Input, Alert } from '@/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ phone: '', password: '', confirm: '', referral_code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleRegister() {
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, password: form.password, referral_code: form.referral_code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/home')
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--sand)' }}>
      <div style={{ background: 'var(--emerald)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          B.B Cooperative
        </div>
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

        <Input label="Phone number" type="tel" placeholder="08012345678" maxLength={11} value={form.phone} onChange={f('phone')} />
        <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={f('password')} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" value={form.confirm} onChange={f('confirm')} />
        <Input label="Referral code (optional)" placeholder="e.g. ABC123" value={form.referral_code} onChange={f('referral_code')} />

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
