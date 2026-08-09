'use client'
import { useEffect, useState } from 'react'
import { Withdrawal } from '@/types'
import { formatNaira } from '@/lib/format'
import { GreenButton } from '@/components/ui'

interface Threshold { amount: number; days: string[] }

const STATUS_STYLE: Record<string, string> = {
  pending: 'pill pill-amber', approved: 'pill pill-emerald',
  paid: 'pill pill-emerald', rejected: 'pill pill-danger',
}

export default function WithdrawPage() {
  const [user, setUser] = useState<{ wallet_balance: number; bank_name: string | null } | null>(null)
  const [thresholds, setThresholds] = useState<Threshold[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [history, setHistory] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
    fetch('/api/withdraw').then(r => r.json()).then(d => Array.isArray(d) && setHistory(d))
    fetch('/api/admin/settings').then(r => r.json()).then(s => {
      if (s.withdrawal_thresholds) setThresholds(s.withdrawal_thresholds)
    })
  }, [])

  async function submit() {
    if (!selected) return
    setError(''); setLoading(true)
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: selected }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else {
      setSuccess('Withdrawal request submitted')
      setSelected(null)
      fetch('/api/withdraw').then(r => r.json()).then(d => Array.isArray(d) && setHistory(d))
      fetch('/api/auth/me').then(r => r.json()).then(setUser)
    }
    setLoading(false)
  }

  const balance = user?.wallet_balance ?? 0
  const availableToday = thresholds.filter(t => t.days.includes(today))

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>Withdrawals</div>
        <div className="stat-row">
          <div className="stat-cell">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Wallet</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>{formatNaira(balance)}</div>
          </div>
          <div className="stat-cell">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Today</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem', textTransform: 'capitalize' }}>{today}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!user?.bank_name && (
          <div className="alert alert-warn">Add a bank account before requesting a withdrawal.</div>
        )}

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="t-subhead" style={{ marginBottom: '0.875rem' }}>Select amount</div>

          {availableToday.length === 0 ? (
            <div className="alert alert-warn">No withdrawals available today. Check back on allowed days.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {availableToday.map(t => {
                const canAfford = balance >= t.amount
                const isSelected = selected === t.amount
                return (
                  <button key={t.amount} onClick={() => canAfford && setSelected(isSelected ? null : t.amount)}
                    style={{ padding: '0.875rem', borderRadius: 'var(--r-sm)', border: isSelected ? '2px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: isSelected ? 'var(--emerald-bg)' : 'var(--white)', cursor: canAfford ? 'pointer' : 'default', opacity: canAfford ? 1 : 0.4, textAlign: 'center', transition: 'all 0.12s' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: isSelected ? 'var(--emerald)' : 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(t.amount)}</div>
                  </button>
                )
              })}
            </div>
          )}

          {selected && (
            <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span className="t-caption">10% fee</span>
                <span className="t-caption">−{formatNaira(selected * 0.1)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>You receive</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--emerald)' }}>{formatNaira(selected * 0.9)}</span>
              </div>
            </div>
          )}

          <GreenButton onClick={submit} disabled={loading || !selected || !user?.bank_name}>
            {loading ? 'Submitting…' : selected ? `Request ${formatNaira(selected)}` : 'Select an amount'}
          </GreenButton>
        </div>

        {history.length > 0 && (
          <div>
            <div className="t-subhead" style={{ marginBottom: '0.75rem' }}>History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {history.map((w) => (
                <div key={w.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(w.amount)}</div>
                    <div className="t-caption" style={{ marginTop: '0.125rem' }}>{new Date(w.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {w.bank_name}</div>
                  </div>
                  <span className={STATUS_STYLE[w.status]}>{w.status.charAt(0).toUpperCase() + w.status.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}