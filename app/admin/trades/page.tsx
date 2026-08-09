'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatNaira, maskPhone } from '@/lib/format'

interface Trade {
  id: string; type: string; status: string; naira_amount: number
  created_at: string; dispute_opened_at: string | null
  user: { phone: string }; vendor: { name: string }
}

const STATUS_PILL: Record<string, string> = {
  pending: 'pill pill-amber', vendor_paid: 'pill pill-emerald',
  settled: 'pill pill-neutral', disputed: 'pill pill-danger', cancelled: 'pill pill-danger',
}

export default function AdminTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [filter, setFilter] = useState('all')

  const load = () => {
    const q = filter !== 'all' ? `?status=${filter}` : ''
    fetch(`/api/admin/trades${q}`).then(r => r.json()).then(d => Array.isArray(d) && setTrades(d))
  }
  useEffect(() => { load() }, [filter])

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>P2P Trades</div>
        <div className="t-caption">{trades.length} trade{trades.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'vendor_paid', 'disputed', 'settled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '0.375rem 1rem', borderRadius: 'var(--r-full)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === s ? 'var(--ink)' : 'var(--white)', color: filter === s ? 'var(--white)' : 'var(--ink-3)', boxShadow: filter === s ? 'none' : '0 0 0 1.5px var(--sand-3) inset', transition: 'all 0.12s' }}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {trades.map(t => (
          <Link key={t.id} href={`/admin/trades/${t.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1.125rem', cursor: 'pointer', borderColor: t.status === 'disputed' ? 'var(--danger)' : 'var(--sand-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.type === 'deposit' ? 'var(--emerald-2)' : 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    {t.type}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(t.naira_amount)}</div>
                </div>
                <span className={STATUS_PILL[t.status] ?? 'pill pill-neutral'}>{t.status.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="t-caption">{maskPhone(t.user?.phone ?? '')} · {t.vendor?.name}</div>
                <div className="t-caption">{new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {t.status === 'disputed' && t.dispute_opened_at && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--danger-bg)', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)' }}>
                  Dispute opened {new Date(t.dispute_opened_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </Link>
        ))}
        {!trades.length && <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No trades</div>}
      </div>
    </div>
  )
}