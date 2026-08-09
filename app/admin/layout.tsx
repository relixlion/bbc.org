import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/products', label: 'Plans' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/rewards', label: 'Gift rewards' },
  { href: '/admin/tasks', label: 'Tasks' },
  { href: '/admin/community', label: 'Community' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/vendors', label: 'Vendors' },
  { href: '/admin/vendor-payouts', label: 'Vendor payouts' },
  { href: '/admin/trades', label: 'P2P Trades' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.is_admin) redirect('/login')

  return (
    <>
      <style>{`
        html, body { max-width: 100% !important; }
        .admin-wrap { display: flex; min-height: 100vh; background: #F5F1EB; font-family: var(--font-body); }
        .admin-sidebar { width: 220px; background: #0F1923; flex-shrink: 0; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 40; }
        .admin-main { flex: 1; margin-left: 220px; display: flex; flex-direction: column; min-height: 100vh; width: calc(100vw - 220px); }
        .admin-header { background: #fff; border-bottom: 1px solid #E8E4DC; padding: 0.875rem 2rem; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 30; }
        .admin-content { padding: 2rem; max-width: 900px; width: 100%; }
        .admin-nav-link { display: block; padding: 0.625rem 0.875rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.55); text-decoration: none; margin-bottom: 2px; transition: background 0.12s, color 0.12s; }
        .admin-nav-link:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .admin-mobile-bar { display: none; background: #0F1923; padding: 0.75rem 1rem; position: sticky; top: 0; z-index: 50; }
        .admin-mobile-brand { font-family: var(--font-display); font-size: 1rem; color: #fff; letter-spacing: -0.02em; margin-bottom: 0.625rem; }
        .admin-mobile-scroll { display: flex; gap: 0.375rem; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
        .admin-mobile-scroll::-webkit-scrollbar { display: none; }
        .admin-mobile-link { flex-shrink: 0; padding: 0.375rem 0.875rem; background: rgba(255,255,255,0.08); border-radius: 999px; font-size: 0.8125rem; font-weight: 600; color: rgba(255,255,255,0.7); text-decoration: none; white-space: nowrap; }
        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-main { margin-left: 0; width: 100%; }
          .admin-header { display: none; }
          .admin-mobile-bar { display: block; }
          .admin-content { padding: 1.25rem; }
        }
      `}</style>
      <div className="admin-wrap">
        <aside className="admin-sidebar">
          <div style={{ padding: '1.5rem 1.25rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>B.B Cooperative</div>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' }}>Admin panel</div>
          </div>
          <nav style={{ padding: '0.625rem', flex: 1, overflowY: 'auto' }}>
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="admin-nav-link">{label}</Link>
            ))}
          </nav>
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/home" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>← Back to app</Link>
          </div>
        </aside>

        <div className="admin-main">
          <div className="admin-mobile-bar">
            <div className="admin-mobile-brand">B.B Cooperative · Admin</div>
            <div className="admin-mobile-scroll">
              {NAV.map(({ href, label }) => (
                <Link key={href} href={href} className="admin-mobile-link">{label}</Link>
              ))}
            </div>
          </div>
          <header className="admin-header">
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#5C6B78' }}>Admin panel</div>
            <div style={{ fontSize: '0.8125rem', color: '#8FA0AD' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </header>
          <main style={{ flex: 1 }}>
            <div className="admin-content">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}