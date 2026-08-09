'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatNaira } from '@/lib/format'

interface Trade { id: string; type: string; status: string; naira_amount: number; created_at: string; vendor: { name: string } }

const STATUS_PILL: Record<string, string> = {
  pending: 'pill pill-amber', vendor_paid: 'pill pill-emerald',
  settled: 'pill pill-neutral', disputed: 'pill pill-danger', cancelled: 'pill pill-danger',
}

export default function MyTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/p2p/trades').then(r => r.json()).then(d => { if (Array.isArray(d)) { setTrades(d); setLoading(false) } })
  }, [])

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>My trades</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Deposits and withdrawals</div>
      </div>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {loading && <div className="spinner" />}
        {!loading && !trades.length && (
          <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No trades yet</div>
        )}
        {trades.map(t => (
          <Link key={t.id} href={`/trades/${t.id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '1rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.type === 'deposit' ? 'var(--emerald-2)' : 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{t.type}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(t.naira_amount)}</div>
                </div>
                <span className={STATUS_PILL[t.status] ?? 'pill pill-neutral'}>{t.status.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="t-caption">Via {t.vendor?.name}</div>
                <div className="t-caption">{new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}