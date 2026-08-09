'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatNaira, maskPhone } from '@/lib/format'

interface Trade {
  id: string
  type: string
  status: string
  naira_amount: number
  usdt_amount: number
  created_at: string
  user: { phone: string }
}

const STATUS_PILL: Record<string, string> = {
  pending: 'pill pill-amber',
  vendor_paid: 'pill pill-emerald',
  settled: 'pill pill-neutral',
  disputed: 'pill pill-danger',
  cancelled: 'pill pill-danger',
}

export default function VendorTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'vendor_paid' | 'disputed' | 'settled'>('all')

  useEffect(() => {
    fetch('/api/p2p/trades').then(r => r.json()).then(d => {
      if (Array.isArray(d)) { setTrades(d); setLoading(false) }
    })
  }, [])

  const filtered = filter === 'all' ? trades : trades.filter(t => t.status === filter)
  const pendingCount = trades.filter(t => t.status === 'pending' || t.status === 'vendor_paid').length
  const disputeCount = trades.filter(t => t.status === 'disputed').length

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>All trades</div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem' }}>
          {pendingCount > 0 && (
            <span className="pill pill-amber">{pendingCount} active</span>
          )}
          {disputeCount > 0 && (
            <span className="pill pill-danger">{disputeCount} disputed</span>
          )}
          <span className="t-caption">{trades.length} total</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'vendor_paid', 'disputed', 'settled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.375rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f ? 'var(--ink)' : 'var(--white)', color: filter === f ? 'var(--white)' : 'var(--ink-3)', boxShadow: filter === f ? 'none' : '0 0 0 1.5px var(--sand-3) inset', transition: 'all 0.12s' }}>
            {f === 'all' ? 'All' : f === 'vendor_paid' ? 'Paid' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 0', fontSize: '0.875rem', color: 'var(--ink-3)' }}>Loading…</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {filtered.map(t => (
          <Link key={t.id} href={`/vendor/trades/${t.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--white)', border: t.status === 'disputed' ? '1.5px solid var(--danger)' : '1px solid var(--sand-2)', borderRadius: '18px', padding: '1.125rem', cursor: 'pointer', transition: 'border-color 0.12s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.type === 'deposit' ? 'var(--emerald-2)' : 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    {t.type === 'deposit' ? 'Deposit — send USDT' : 'Withdrawal — pay user'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                    {formatNaira(t.naira_amount)}
                  </div>
                </div>
                <span className={STATUS_PILL[t.status] ?? 'pill pill-neutral'}>
                  {t.status === 'vendor_paid' ? 'Paid' : t.status.replace('_', ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink-3)' }}>
                  {maskPhone(t.user?.phone ?? '')}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ink-3)' }}>
                  {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {t.status === 'disputed' && (
                <div style={{ marginTop: '0.625rem', padding: '0.5rem 0.75rem', background: 'var(--danger-bg)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)' }}>
                  Dispute open — awaiting admin resolution
                </div>
              )}
            </div>
          </Link>
        ))}

        {!loading && !filtered.length && (
          <div style={{ textAlign: 'center', padding: '3rem 0', fontSize: '0.875rem', color: 'var(--ink-3)' }}>
            {filter === 'all' ? 'No trades yet' : `No ${filter} trades`}
          </div>
        )}
      </div>
    </div>
  )
}