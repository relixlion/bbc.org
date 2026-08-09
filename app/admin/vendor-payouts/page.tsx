'use client'
import { useEffect, useState } from 'react'
import { formatNaira } from '@/lib/format'

interface PayoutRequest {
  id: string
  vendor_id: string
  vendor_name: string
  usdt_amount: number
  usdt_address: string
  naira_equivalent: number
  rate: number
  note: string | null
  status: string
  admin_note: string | null
  created_at: string
  resolved_at: string | null
}

const STATUS_PILL: Record<string, string> = {
  pending: 'pill pill-amber',
  paid: 'pill pill-emerald',
  rejected: 'pill pill-danger',
}

export default function AdminVendorPayouts() {
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState<Record<string, string>>({})

  const load = () => {
    fetch('/api/admin/vendor-payouts').then(r => r.json()).then(d => {
      if (Array.isArray(d)) { setRequests(d); setLoading(false) }
    })
  }
  useEffect(() => { load() }, [])

  async function resolve(id: string, status: 'paid' | 'rejected') {
    setProcessing(id)
    await fetch('/api/admin/vendor-payouts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, admin_note: adminNote[id] ?? null }),
    })
    setProcessing(null)
    load()
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const totalPaid = requests.filter(r => r.status === 'paid').reduce((s, r) => s + r.usdt_amount, 0)

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.5rem' }}>Vendor payouts</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {pendingCount > 0 && <span className="pill pill-amber">{pendingCount} pending</span>}
          <span className="pill pill-neutral">{totalPaid.toFixed(2)} USDT paid total</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'paid', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.375rem 1rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f ? 'var(--ink)' : 'var(--white)', color: filter === f ? 'var(--white)' : 'var(--ink-3)', boxShadow: filter === f ? 'none' : '0 0 0 1.5px var(--sand-3) inset', transition: 'all 0.12s' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="t-caption" style={{ textAlign: 'center', padding: '3rem' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(r => (
            <div key={r.id} className="card" style={{ padding: '1.25rem', borderColor: r.status === 'pending' ? 'var(--amber)' : 'var(--sand-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{r.vendor_name}</div>
                  <div className="t-caption">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <span className={STATUS_PILL[r.status] ?? 'pill pill-neutral'}>{r.status}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>USDT requested</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{r.usdt_amount.toFixed(4)}</div>
                </div>
                <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>Naira equivalent</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(r.naira_equivalent)}</div>
                </div>
                <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>Rate used</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>₦{r.rate.toLocaleString()}/$</div>
                </div>
              </div>

              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: r.note ? '0.625rem' : '0', wordBreak: 'break-all' }}>
                <div className="t-label" style={{ marginBottom: '0.25rem' }}>USDT wallet address</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--ink-2)' }}>{r.usdt_address}</div>
              </div>

              {r.note && (
                <div style={{ background: 'var(--amber-bg)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: '0.625rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.25rem', color: '#7A5500' }}>Vendor note</div>
                  <div style={{ fontSize: '0.875rem', color: '#7A5500' }}>{r.note}</div>
                </div>
              )}

              {r.admin_note && (
                <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: '0.625rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.25rem', color: 'var(--emerald-2)' }}>Admin note</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--emerald-2)' }}>{r.admin_note}</div>
                </div>
              )}

              {r.status === 'pending' && (
                <div style={{ borderTop: '1px solid var(--sand-2)', paddingTop: '0.875rem', marginTop: '0.875rem' }}>
                  <textarea
                    placeholder="Optional note to vendor…"
                    value={adminNote[r.id] ?? ''}
                    onChange={e => setAdminNote(n => ({ ...n, [r.id]: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--sand-3)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', resize: 'none', minHeight: 56, outline: 'none', marginBottom: '0.625rem', color: 'var(--ink)', background: 'var(--white)' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button onClick={() => resolve(r.id, 'paid')} disabled={processing === r.id}
                      style={{ background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: processing === r.id ? 0.7 : 1 }}>
                      {processing === r.id ? '…' : '✓ Mark as paid'}
                    </button>
                    <button onClick={() => resolve(r.id, 'rejected')} disabled={processing === r.id}
                      style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #F5C6C2', borderRadius: 'var(--r-md)', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: processing === r.id ? 0.7 : 1 }}>
                      {processing === r.id ? '…' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}

              {r.status !== 'pending' && r.resolved_at && (
                <div className="t-caption" style={{ marginTop: '0.5rem' }}>
                  {r.status === 'paid' ? 'Paid' : 'Rejected'} on {new Date(r.resolved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          ))}
          {!filtered.length && (
            <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No payout requests</div>
          )}
        </div>
      )}
    </div>
  )
}
