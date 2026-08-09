'use client'
import { useEffect, useState } from 'react'
import { formatNaira } from '@/lib/format'

interface PayoutRequest {
  id: string
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

interface Trade {
  id: string
  type: string
  status: string
  naira_amount: number
  created_at: string
}

const FEE_PCT = 5
const STATUS_PILL: Record<string, string> = {
  pending: 'pill pill-amber',
  paid: 'pill pill-emerald',
  rejected: 'pill pill-danger',
}

export default function VendorPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [rate, setRate] = useState(1600)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ usdt_amount: '', usdt_address: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const [payoutsRes, tradesRes, settingsRes] = await Promise.all([
        fetch('/api/vendor/payout').then(r => r.ok ? r.json() : []),
        fetch('/api/p2p/trades').then(r => r.ok ? r.json() : []),
        fetch('/api/settings').then(r => r.ok ? r.json() : {}),
      ])
      if (Array.isArray(payoutsRes)) setRequests(payoutsRes)
      if (Array.isArray(tradesRes)) setTrades(tradesRes)
      const s = settingsRes as Record<string, unknown>
    if (s?.p2p_rate) setRate(Number(s.p2p_rate))
    } catch (e) {
      console.error('Payouts load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const settledTrades = trades.filter(t => t.status === 'settled')

  // Commissions: 5% of every settled trade
  const totalCommissions = settledTrades.reduce((s, t) => s + (t.naira_amount * FEE_PCT / 100), 0)

  // Withdrawals paid to users: naira_amount of settled withdrawal trades
  const totalWithdrawalsPaid = settledTrades
    .filter(t => t.type === 'withdrawal')
    .reduce((s, t) => s + t.naira_amount, 0)

  // Total owed by admin = commissions + withdrawals fronted
  const totalOwed = totalCommissions + totalWithdrawalsPaid

  // Already paid out via payout requests
  const totalPaidOut = requests
    .filter(r => r.status === 'paid')
    .reduce((s, r) => s + r.naira_equivalent, 0)

  // Pending payout requests
  const totalPending = requests
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + r.naira_equivalent, 0)

  // Available to request
  const available = Math.max(0, totalOwed - totalPaidOut - totalPending)
  const availableUsdt = available / rate

  async function submit() {
    setError(''); setSubmitting(true)
    const res = await fetch('/api/vendor/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usdt_amount: Number(form.usdt_amount),
        usdt_address: form.usdt_address,
        note: form.note || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong — check your connection and try again')
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setForm({ usdt_amount: '', usdt_address: '', note: '' })
    setSubmitting(false)
    load()
  }

  const nairaEquiv = Number(form.usdt_amount) > 0 ? Number(form.usdt_amount) * rate : 0
  const requestedUsdt = Number(form.usdt_amount)
  const exceedsAvailable = requestedUsdt > availableUsdt && availableUsdt > 0

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>My payouts</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--ink-3)' }}>Request USDT settlement for what admin owes you</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', fontSize: '0.875rem', color: 'var(--ink-3)' }}>Loading your balance…</div>
      ) : (
        <>
          {/* Balance breakdown */}
          <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.375rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total admin owes you</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>{formatNaira(totalOwed)}</div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1.25rem' }}>
              {(totalOwed / rate).toFixed(4)} USDT at ₦{rate.toLocaleString()}/$
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Commissions</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.02em' }}>{formatNaira(totalCommissions)}</div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>{FEE_PCT}% per trade</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Withdrawals fronted</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.02em' }}>{formatNaira(totalWithdrawalsPaid)}</div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>Paid to users</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Already settled</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.02em' }}>{formatNaira(totalPaidOut)}</div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>{totalPending > 0 ? `+${formatNaira(totalPending)} pending` : 'No pending'}</div>
              </div>
            </div>
          </div>

          {/* Available to request */}
          <div style={{ background: available > 0 ? 'var(--emerald-bg)' : 'var(--sand)', border: `1px solid ${available > 0 ? '#B7DFD0' : 'var(--sand-3)'}`, borderRadius: 'var(--r-lg)', padding: '1.125rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="t-label" style={{ marginBottom: '0.25rem', color: available > 0 ? 'var(--emerald-2)' : 'var(--ink-4)' }}>Available to request</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: available > 0 ? 'var(--emerald)' : 'var(--ink-3)', letterSpacing: '-0.02em' }}>{formatNaira(available)}</div>
              <div className="t-caption">{availableUsdt.toFixed(4)} USDT</div>
            </div>
            {totalPending > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div className="t-label" style={{ marginBottom: '0.25rem' }}>Pending approval</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--amber)', letterSpacing: '-0.02em' }}>{formatNaira(totalPending)}</div>
              </div>
            )}
          </div>

          {/* Request form */}
          <div style={{ background: '#fff', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '1rem' }}>New payout request</div>

            {submitted && (
              <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Request submitted — admin will process it.</span>
                <button onClick={() => setSubmitted(false)} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--emerald-2)', background: 'none', border: 'none', cursor: 'pointer' }}>New</button>
              </div>
            )}
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {!submitted && (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.5rem' }}>USDT amount to receive</div>
                  <input type="number" placeholder={`Max ${availableUsdt.toFixed(4)} USDT`} value={form.usdt_amount}
                    onChange={e => setForm(f => ({ ...f, usdt_amount: e.target.value }))}
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--r-sm)', border: `1.5px solid ${exceedsAvailable ? 'var(--danger)' : 'var(--sand-3)'}`, fontSize: '1rem', fontFamily: 'var(--font-body)', outline: 'none', color: 'var(--ink)', background: 'var(--white)' }} />
                  {nairaEquiv > 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.875rem', background: exceedsAvailable ? 'var(--danger-bg)' : 'var(--sand)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="t-caption">{exceedsAvailable ? 'Exceeds available balance' : `Naira equiv at ₦${rate.toLocaleString()}/$`}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: exceedsAvailable ? 'var(--danger)' : 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(nairaEquiv)}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.5rem' }}>Your USDT wallet address (TRC-20)</div>
                  <input type="text" placeholder="T…" value={form.usdt_address}
                    onChange={e => setForm(f => ({ ...f, usdt_address: e.target.value }))}
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--sand-3)', fontSize: '0.875rem', fontFamily: 'monospace', outline: 'none', color: 'var(--ink)', background: 'var(--white)' }} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.5rem' }}>Note to admin (optional)</div>
                  <textarea placeholder="Any context about this request…" value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--sand-3)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', resize: 'none', minHeight: 64, outline: 'none', color: 'var(--ink)', background: 'var(--white)' }} />
                </div>

                <button onClick={submit}
                  disabled={submitting || !form.usdt_amount || !form.usdt_address || exceedsAvailable || available <= 0}
                  style={{ width: '100%', background: (!form.usdt_amount || !form.usdt_address || exceedsAvailable || available <= 0) ? 'var(--sand-2)' : 'var(--emerald)', color: (!form.usdt_amount || !form.usdt_address || exceedsAvailable || available <= 0) ? 'var(--ink-4)' : 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: (!form.usdt_amount || !form.usdt_address || exceedsAvailable || available <= 0) ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'all 0.12s' }}>
                  {submitting ? 'Submitting…' : available <= 0 ? 'Nothing available to request' : exceedsAvailable ? 'Amount exceeds available balance' : 'Request payout'}
                </button>
              </>
            )}
          </div>

          {/* History */}
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>Request history</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {requests.map(r => (
              <div key={r.id} style={{ background: '#fff', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '1.125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.125rem' }}>{r.usdt_amount.toFixed(4)} USDT</div>
                    <div className="t-caption">{formatNaira(r.naira_equivalent)} · ₦{r.rate.toLocaleString()}/$</div>
                  </div>
                  <span className={STATUS_PILL[r.status] ?? 'pill pill-neutral'}>{r.status}</span>
                </div>
                <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.875rem', marginBottom: r.admin_note ? '0.5rem' : 0, wordBreak: 'break-all', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--ink-3)' }}>
                  {r.usdt_address}
                </div>
                {r.admin_note && (
                  <div style={{ background: r.status === 'paid' ? 'var(--emerald-bg)' : 'var(--danger-bg)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.875rem', marginTop: '0.5rem', fontSize: '0.8125rem', color: r.status === 'paid' ? 'var(--emerald-2)' : 'var(--danger)' }}>
                    Admin: {r.admin_note}
                  </div>
                )}
                <div className="t-caption" style={{ marginTop: '0.5rem' }}>
                  {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {r.resolved_at && ` · ${r.status === 'paid' ? 'Paid' : 'Rejected'} ${new Date(r.resolved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                </div>
              </div>
            ))}
            {!requests.length && (
              <div style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem', color: 'var(--ink-3)' }}>No requests yet</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}