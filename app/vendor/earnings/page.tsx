import { redirect } from 'next/navigation'
import { getVendorSession } from '@/lib/vendor-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'

const FEE_PCT = 5

export default async function VendorEarningsPage() {
  const session = await getVendorSession()
  if (!session) redirect('/vendor/login')

  const { data: trades } = await supabaseAdmin
    .from('p2p_trades')
    .select('id, type, naira_amount, status, created_at, settled_at')
    .eq('vendor_id', session.id)
    .order('created_at', { ascending: false })

  const settled = trades?.filter(t => t.status === 'settled') ?? []
  const pending = trades?.filter(t => !['settled', 'cancelled'].includes(t.status)) ?? []

  const totalEarned = settled.reduce((s, t) => s + (t.naira_amount * FEE_PCT / 100), 0)
  const totalVolume = settled.reduce((s, t) => s + t.naira_amount, 0)
  const pendingVolume = pending.reduce((s, t) => s + t.naira_amount, 0)
  const pendingEarnings = pending.reduce((s, t) => s + (t.naira_amount * FEE_PCT / 100), 0)

  const depositSettled = settled.filter(t => t.type === 'deposit')
  const withdrawalSettled = settled.filter(t => t.type === 'withdrawal')

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>My earnings</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--ink-3)' }}>{FEE_PCT}% commission per settled trade</div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.25rem', gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Total earned</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>{formatNaira(totalEarned)}</div>
          <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}>From {formatNaira(totalVolume)} total volume · {settled.length} trades</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '1.125rem' }}>
          <div className="t-label" style={{ marginBottom: '0.375rem' }}>Deposits</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(depositSettled.reduce((s, t) => s + t.naira_amount * FEE_PCT / 100, 0))}</div>
          <div className="t-caption" style={{ marginTop: '0.25rem' }}>{depositSettled.length} settled</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '1.125rem' }}>
          <div className="t-label" style={{ marginBottom: '0.375rem' }}>Withdrawals</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--amber)', letterSpacing: '-0.02em' }}>{formatNaira(withdrawalSettled.reduce((s, t) => s + t.naira_amount * FEE_PCT / 100, 0))}</div>
          <div className="t-caption" style={{ marginTop: '0.25rem' }}>{withdrawalSettled.length} settled</div>
        </div>

        {pendingEarnings > 0 && (
          <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-dim)', borderRadius: 'var(--r-lg)', padding: '1.125rem', gridColumn: '1 / -1' }}>
            <div className="t-label" style={{ marginBottom: '0.375rem', color: '#7A5500' }}>Pending earnings</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--amber)', letterSpacing: '-0.02em' }}>{formatNaira(pendingEarnings)}</div>
            <div className="t-caption" style={{ marginTop: '0.25rem' }}>From {formatNaira(pendingVolume)} in open trades — earns when settled</div>
          </div>
        )}
      </div>

      {/* Trade breakdown */}
      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>Trade history</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {trades?.map(t => {
          const commission = t.naira_amount * FEE_PCT / 100
          const isSettled = t.status === 'settled'
          return (
            <div key={t.id} style={{ background: '#fff', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '0', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: 4, flexShrink: 0, background: t.type === 'deposit' ? 'var(--emerald)' : 'var(--amber)' }} />
              <div style={{ flex: 1, padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.type === 'deposit' ? 'var(--emerald-2)' : 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>{t.type}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{formatNaira(t.naira_amount)}</div>
                  <div className="t-caption">{new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: isSettled ? 'var(--emerald)' : 'var(--ink-3)', letterSpacing: '-0.02em' }}>
                    {isSettled ? '+' : '~'}{formatNaira(commission)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: isSettled ? 'var(--emerald-2)' : 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.125rem' }}>
                    {isSettled ? 'Earned' : t.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {!trades?.length && (
          <div style={{ textAlign: 'center', padding: '3rem 0', fontSize: '0.875rem', color: 'var(--ink-3)' }}>No trades yet</div>
        )}
      </div>
    </div>
  )
}