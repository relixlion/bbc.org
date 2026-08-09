import Link from 'next/link'
import { getVendorSession } from '@/lib/vendor-auth'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getVendorSession()
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        :root {
          --ink: #0F1923; --ink-2: #2C3A47; --ink-3: #5C6B78; --ink-4: #8FA0AD;
          --sand: #F5F1EB; --sand-2: #EDE8E0; --sand-3: #DDD8CE;
          --emerald: #0D4A3A; --emerald-2: #1A6B52; --emerald-bg: #EAF4EF;
          --amber: #E8A020; --amber-bg: #FDF6E3; --amber-dim: #E8D5A0;
          --danger: #D94040; --danger-bg: #FDF0F0; --white: #FFFFFF;
          --font-display: 'DM Serif Display', serif;
          --font-body: 'DM Sans', sans-serif;
          --r-sm: 10px; --r-md: 14px; --r-lg: 18px; --r-full: 999px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-body); background: var(--sand); color: var(--ink); }
        .card { background: #fff; border: 1px solid var(--sand-3); border-radius: var(--r-lg); padding: 1.125rem; }
        .pill { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: var(--r-full); font-size: 0.75rem; font-weight: 700; }
        .pill-emerald { background: var(--emerald-bg); color: var(--emerald-2); }
        .pill-amber { background: var(--amber-bg); color: #7A5500; }
        .pill-neutral { background: var(--sand-2); color: var(--ink-3); }
        .pill-danger { background: var(--danger-bg); color: var(--danger); }
        .t-label { font-size: 0.6875rem; font-weight: 700; color: var(--ink-4); letter-spacing: 0.05em; text-transform: uppercase; }
        .t-caption { font-size: 0.75rem; color: var(--ink-3); }
        .t-body { font-size: 0.9375rem; color: var(--ink-2); }
        .t-subhead { font-size: 1rem; font-weight: 700; color: var(--ink); }
        .alert { border-radius: var(--r-sm); padding: 0.75rem 1rem; font-size: 0.8125rem; }
        .alert-error { background: var(--danger-bg); color: var(--danger); border: 1px solid #F5C6C2; }
        .alert-success { background: var(--emerald-bg); color: var(--emerald-2); border: 1px solid #B7DFD0; }
        .alert-warn { background: var(--amber-bg); color: #7A5500; border: 1px solid var(--amber-dim); }
        input, textarea { font-family: var(--font-body); }
      `}</style>
      <div style={{ minHeight: '100svh', background: 'var(--sand)' }}>
        {session && (
          <div style={{ background: '#0F1923', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>B.B Cooperative</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>Vendor · {session.name}</div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <Link href="/vendor/dashboard" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Dashboard</Link>
              <Link href="/vendor/trades" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Trades</Link>
              <Link href="/vendor/earnings" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Earnings</Link>
              <form action="/api/vendor/auth/logout" method="POST">
                <button type="submit" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
              </form>
            </div>
          </div>
        )}
        <main style={{ padding: '1.5rem', maxWidth: 860, margin: '0 auto' }}>{children}</main>
      </div>
    </>
  )
}