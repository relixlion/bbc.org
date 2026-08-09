import { redirect } from 'next/navigation'
import { getVendorSession } from '@/lib/vendor-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  pending: '#C9962A', vendor_paid: '#0D4A3A', confirmed: '#0D4A3A',
  disputed: '#C0392B', settled: '#5C6B78', cancelled: '#5C6B78', expired: '#5C6B78'
}

export default async function VendorDashboard() {
  const session = await getVendorSession()
  if (!session) redirect('/vendor/login')

  const { data: trades } = await supabaseAdmin
    .from('p2p_trades')
    .select('*, user:users(phone)')
    .eq('vendor_id', session.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const pending = trades?.filter(t => ['pending', 'vendor_paid'].includes(t.status)) ?? []
  const disputed = trades?.filter(t => t.status === 'disputed') ?? []
  const completed = trades?.filter(t => ['confirmed', 'settled', 'cancelled', 'expired'].includes(t.status)) ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#0F1923', fontFamily: 'var(--font-body)' }}>
      <header style={{ background: '#0A1219', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.02em' }}>B.B Cooperative</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>Vendor · {session.name}</div>
        </div>
        <form action="/api/vendor/auth" method="POST">
          <Link href="/vendor/login" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Sign out</Link>
        </form>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem' }}>
        {disputed.length > 0 && (
          <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E57373', marginBottom: '0.25rem' }}>⚠ {disputed.length} disputed trade{disputed.length !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Respond in the thread to avoid auto-settlement</div>
          </div>
        )}

        {/* Active trades */}
        <div style={{ marginBottom: '0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Active trades ({pending.length + disputed.length})
        </div>

        {[...pending, ...disputed].map(t => (
          <Link key={t.id} href={`/vendor/trades/${t.id}`} style={{ display: 'block', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.125rem', marginBottom: '0.625rem', textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  {t.type === 'deposit' ? 'Deposit — send USDT' : 'Withdrawal — pay user'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: '#fff', letterSpacing: '-0.02em' }}>{formatNaira(t.naira_amount)}</div>
                {t.type === 'deposit' && <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{t.usdt_amount} USDT to send</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: STATUS_COLOR[t.status] ?? '#888', background: 'rgba(255,255,255,0.06)', padding: '0.25rem 0.625rem', borderRadius: 999 }}>
                  {t.status.replace('_', ' ').charAt(0).toUpperCase() + t.status.replace('_', ' ').slice(1)}
                </span>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
                {(t.user as { phone: string })?.phone?.slice(0,4)}*****{(t.user as { phone: string })?.phone?.slice(-3)}
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0D4A3A' }}>View trade →</div>
            </div>
          </Link>
        ))}

        {pending.length === 0 && disputed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>No active trades</div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Completed ({completed.length})
            </div>
            {completed.slice(0, 10).map(t => (
              <Link key={t.id} href={`/vendor/trades/${t.id}`} style={{ display: 'block', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '0.875rem 1.125rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.02em' }}>{formatNaira(t.naira_amount)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.125rem' }}>{t.type} · {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: STATUS_COLOR[t.status], fontWeight: 600 }}>{t.status}</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
