'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/format'

interface Vendor { id: string; name: string; min_limit: number; max_limit: number }
interface Threshold { amount: number; days: string[] }

export default function WithdrawP2PPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [thresholds, setThresholds] = useState<Threshold[]>([])
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [user, setUser] = useState<{ wallet_balance: number; bank_name: string | null } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [trade, setTrade] = useState<Record<string, unknown> | null>(null)
  const [fee, setFee] = useState(0)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  useEffect(() => {
    fetch('/api/p2p/vendors').then(r => r.json()).then(d => Array.isArray(d) && setVendors(d))
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
    fetch('/api/admin/settings').then(r => r.json()).then(s => {
      if (s.p2p_withdrawal_thresholds) setThresholds(s.p2p_withdrawal_thresholds)
    })
  }, [])

  const availableThresholds = thresholds.filter(t => t.days.includes(today))

  async function submit() {
    if (!selected || !amount) return
    setLoading(true); setError('')
    const res = await fetch('/api/p2p/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: selected.id, naira_amount: amount }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setTrade(data.trade)
    setFee(data.fee)
    setLoading(false)
  }

  if (trade) {
    return (
      <div style={{ paddingBottom: '5rem' }}>
        <div className="page-header">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>Withdrawal initiated</div>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="alert alert-success">Your withdrawal is being processed. The vendor will pay you shortly.</div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="t-label" style={{ marginBottom: '0.375rem' }}>Amount you receive</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--emerald)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>{formatNaira(trade.naira_amount as number)}</div>
            <div className="t-caption">After {fee > 0 ? `₦${fee.toLocaleString()} fee` : 'no fee'}</div>
          </div>
          <button onClick={() => router.push(`/trades/${trade.id}`)} style={{ width: '100%', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
            Track this withdrawal →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.75rem', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Withdraw funds</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-sm)', overflow: 'hidden', marginTop: '0.875rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Balance</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>{formatNaira(user?.wallet_balance ?? 0)}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Today</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem', textTransform: 'capitalize' }}>{today}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div className="alert alert-error">{error}</div>}

        {!user?.bank_name && (
          <div className="alert alert-warn">Add a bank account in your profile before withdrawing.</div>
        )}

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="t-subhead" style={{ marginBottom: '0.875rem' }}>Select amount</div>
          {availableThresholds.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.875rem' }}>
              {availableThresholds.map(t => (
                <button key={t.amount} onClick={() => setAmount(amount === t.amount ? null : t.amount)}
                  style={{ padding: '0.875rem', borderRadius: 'var(--r-sm)', border: amount === t.amount ? '2px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: amount === t.amount ? 'var(--emerald-bg)' : 'var(--white)', cursor: (user?.wallet_balance ?? 0) < t.amount ? 'default' : 'pointer', opacity: (user?.wallet_balance ?? 0) < t.amount ? 0.4 : 1, textAlign: 'center', transition: 'all 0.12s' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: amount === t.amount ? 'var(--emerald)' : 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(t.amount)}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="alert alert-warn">No withdrawals available today.</div>
          )}

          {amount && (
            <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--ink-3)', marginBottom: '0.25rem' }}>
                <span>10% fee</span>
                <span>−{formatNaira(amount * 0.1)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>
                <span>You receive</span>
                <span>{formatNaira(amount * 0.9)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="t-subhead" style={{ marginBottom: '0.875rem' }}>Choose vendor</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {vendors.map(v => (
              <button key={v.id} onClick={() => setSelected(v)}
                style={{ width: '100%', textAlign: 'left', padding: '0.875rem 1rem', borderRadius: 'var(--r-sm)', border: selected?.id === v.id ? '2px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: selected?.id === v.id ? 'var(--emerald-bg)' : 'var(--white)', cursor: 'pointer', transition: 'all 0.12s' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: selected?.id === v.id ? 'var(--emerald)' : 'var(--ink)', marginBottom: '0.25rem' }}>{v.name}</div>
                <div className="t-caption">Limit: {formatNaira(v.min_limit)} – {formatNaira(v.max_limit)}</div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={loading || !selected || !amount || !user?.bank_name}
          style={{ width: '100%', background: !selected || !amount ? 'var(--sand-2)' : 'var(--emerald)', color: !selected || !amount ? 'var(--ink-4)' : 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: !selected || !amount ? 'default' : 'pointer', transition: 'all 0.12s' }}>
          {loading ? 'Processing…' : selected && amount ? `Request ${formatNaira(amount)} withdrawal` : 'Select amount and vendor'}
        </button>
      </div>
    </div>
  )
}