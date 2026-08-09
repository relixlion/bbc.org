'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VendorLogin() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setError(''); setLoading(true)
    const res = await fetch('/api/vendor/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password, action: 'login' }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/vendor/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F1923', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>B.B Cooperative</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2.5rem' }}>Vendor portal</div>

        {error && <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#E57373', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.375rem', letterSpacing: '0.03em' }}>Phone number</div>
          <input type="tel" placeholder="0801…" value={phone} onChange={e => setPhone(e.target.value)} maxLength={11}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.9375rem', color: '#fff', outline: 'none', fontFamily: 'var(--font-body)' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '0.375rem', letterSpacing: '0.03em' }}>Password</div>
          <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.875rem 1rem', fontSize: '0.9375rem', color: '#fff', outline: 'none', fontFamily: 'var(--font-body)' }} />
        </div>
        <button onClick={login} disabled={loading}
          style={{ width: '100%', background: '#0D4A3A', color: '#fff', border: 'none', borderRadius: 10, padding: '0.9375rem', fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
