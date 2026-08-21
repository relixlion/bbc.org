'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function OnboardingModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('bbc_onboarding_seen')
    if (!seen) setShow(true)
  }, [])

  function dismiss() {
    localStorage.setItem('bbc_onboarding_seen', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--white)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430, maxHeight: '88svh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {/* Header */}
        <div style={{ background: 'var(--emerald)', borderRadius: '24px 24px 0 0', padding: '2rem 1.5rem 1.75rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            Welcome to<br />B.B Cooperative
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Here's how we generate income for you
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* What we do */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--sand)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>📣</div>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>Advertising revenue</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink-3)', lineHeight: 1.6 }}>We partner with leading brands to drive sales campaigns. The revenue flows back to our members.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--sand)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>💱</div>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>Forex trading</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink-3)', lineHeight: 1.6 }}>We trade currency pairs for banks and institutions — consistent yields, distributed to you.</div>
              </div>
            </div>
          </div>

          {/* How you earn */}
          <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-md)', padding: '1.125rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Your earnings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                ['📈', 'Daily returns on your investment plan'],
                ['💼', 'Weekly salary per active plan'],
                ['🤝', 'Referral commissions across 3 levels'],
                ['✅', 'Daily check-in bonus'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button onClick={dismiss}
            style={{ width: '100%', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '1rem', fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', marginBottom: '0.75rem' }}>
            Get started →
          </button>

          <Link href="/about" onClick={dismiss}
            style={{ display: 'block', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-3)', textDecoration: 'none' }}>
            Learn more about us
          </Link>
        </div>
      </div>
    </div>
  )
}