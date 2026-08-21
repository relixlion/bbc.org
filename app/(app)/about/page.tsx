import Link from 'next/link'

export default function AboutPage() {
  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Hero */}
      <div style={{ background: 'var(--emerald)', padding: '3rem 1.5rem 2.5rem', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.75rem' }}>
          B.B Cooperative
        </div>
        <div style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
          Where advertising meets currency markets — and both work for you.
        </div>
      </div>

      <div style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* What we do */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', padding: '1.5rem', border: '1px solid var(--sand-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--emerald-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Advertising partnerships</div>
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--ink-2)', lineHeight: 1.7 }}>
            We partner with growing and leading brands to drive real sales and engagement. Every campaign we run generates measurable returns — returns that flow back to our members.
          </div>
        </div>

        {/* Currency trading */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', padding: '1.5rem', border: '1px solid var(--sand-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--emerald-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Currency & forex trading</div>
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--ink-2)', lineHeight: 1.7 }}>
            We trade currency pairs on behalf of banks and financial institutions. Through forex markets, we convert volume into consistent yields — distributed directly to our investment members.
          </div>
        </div>

        {/* How you earn */}
        <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>How you earn</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { icon: '📈', title: 'Daily returns', desc: 'Your investment plan earns a fixed daily return, every day it is active.' },
              { icon: '💼', title: 'Weekly salary', desc: 'Each active plan also pays a weekly salary directly to your wallet.' },
              { icon: '🤝', title: 'Referral commissions', desc: 'Invite others and earn across three levels of commission on their investments.' },
              { icon: '✅', title: 'Daily check-in', desc: 'Show up every day and claim a small bonus just for being active.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: 2 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.25rem' }}>{title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust signals */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', padding: '1.5rem', border: '1px solid var(--sand-2)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Our commitment</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'Returns are paid from real revenue — advertising deals and trading yields',
              'Withdrawals are processed peer-to-peer through verified vendors',
              'Your data and wallet are yours — we never lend or pool member balances',
              'Our community feed shows real verified payouts from real members',
            ].map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--emerald-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink-2)', lineHeight: 1.6 }}>{line}</div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/products" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.125rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.125rem' }}>Start earning</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Browse investment plans and pick your first</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
          </div>
        </Link>
      </div>
    </div>
  )
}