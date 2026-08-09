'use client'
import { useEffect, useState } from 'react'
import { Withdrawal } from '@/types'
import { formatNaira, maskPhone } from '@/lib/format'

const STATUS_PILL: Record<string, string> = {
  pending: 'pill pill-amber', approved: 'pill pill-emerald',
  paid: 'pill pill-emerald', rejected: 'pill pill-danger',
}
const TIER: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }

export default function AdminWithdrawals() {
  const [wds, setWds] = useState<Withdrawal[]>([])
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  const load = () => fetch(`/api/admin/withdrawals?status=${filter}`).then(r => r.json()).then(d => Array.isArray(d) && setWds(d))
  useEffect(() => { load() }, [filter])

  async function update(id: string, status: string) {
    setProcessing(id)
    await fetch('/api/admin/withdrawals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    setProcessing(null); load()
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Withdrawals</div>
        <div className="t-caption">{wds.length} {filter} request{wds.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['pending', 'approved', 'paid', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '0.375rem 1rem', borderRadius: 'var(--r-full)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === s ? 'var(--ink)' : 'var(--white)', color: filter === s ? 'var(--white)' : 'var(--ink-3)', boxShadow: filter === s ? 'none' : '0 0 0 1.5px var(--sand-3) inset', transition: 'all 0.12s' }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {wds.map((w) => {
          const user = w.user as { phone: string; tier: string } | undefined
          return (
            <div key={w.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{formatNaira(w.amount)}</div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span className="pill pill-neutral">{maskPhone(user?.phone ?? '')}</span>
                    <span className="pill pill-neutral">{TIER[user?.tier ?? ''] ?? user?.tier}</span>
                  </div>
                </div>
                <span className={STATUS_PILL[w.status] ?? 'pill pill-neutral'}>{w.status.charAt(0).toUpperCase() + w.status.slice(1)}</span>
              </div>

              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: '0.875rem' }}>
                <div className="t-label" style={{ marginBottom: '0.375rem' }}>Bank details</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{w.account_number}</div>
                <div className="t-caption">{w.bank_name} · {w.account_name}</div>
              </div>

              <div className="t-caption" style={{ marginBottom: '0.875rem' }}>
                Requested {new Date(w.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              {w.status === 'pending' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button onClick={() => update(w.id, 'approved')} disabled={processing === w.id}
                    style={{ background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-sm)', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: processing === w.id ? 0.6 : 1 }}>
                    {processing === w.id ? '…' : 'Approve'}
                  </button>
                  <button onClick={() => update(w.id, 'rejected')} disabled={processing === w.id}
                    style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #F5C6C2', borderRadius: 'var(--r-sm)', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: processing === w.id ? 0.6 : 1 }}>
                    Reject
                  </button>
                </div>
              )}
              {w.status === 'approved' && (
                <button onClick={() => update(w.id, 'paid')} disabled={processing === w.id}
                  style={{ width: '100%', background: 'var(--amber)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-sm)', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: processing === w.id ? 0.6 : 1 }}>
                  {processing === w.id ? 'Updating…' : 'Mark as paid'}
                </button>
              )}
            </div>
          )
        })}
        {!wds.length && <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No {filter} withdrawals</div>}
      </div>
    </div>
  )
}
