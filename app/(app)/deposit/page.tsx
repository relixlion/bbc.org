'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/format'
import { GreenButton } from '@/components/ui'

interface Vendor { id: string; name: string; min_limit: number; max_limit: number }

export default function DepositPage() {
  const router = useRouter()
  const [step, setStep] = useState<'amount' | 'vendor' | 'success'>('amount')
  const [amount, setAmount] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [tradeId, setTradeId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    fetch('/api/p2p/vendors').then(r => r.json()).then(d => Array.isArray(d) && setVendors(d))
  }, [])

  async function initiate() {
    if (!selected || !amount) return
    setLoading(true); setError('')
    const res = await fetch('/api/p2p/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: selected.id, naira_amount: Number(amount) }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setConfirmed(true)
    const tradeObj = data.trade ?? data
    setTradeId(tradeObj.id)
    setLoading(false)
    setTimeout(() => setStep('success'), 400)
  }

  const filtered = vendors.filter(v => Number(amount) >= v.min_limit && Number(amount) <= v.max_limit)

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <button onClick={() => step === 'vendor' ? setStep('amount') : router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.75rem', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Deposit funds</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Add money to your wallet</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div className="alert alert-error">{error}</div>}

        {/* SUCCESS STATE */}
        {step === 'success' && tradeId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>✓</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Trade opened</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                Go to My trades to see the vendor's bank account and complete your transfer. Do not open another deposit for the same amount.
              </div>
            </div>
            <button onClick={() => router.push(`/trades/${tradeId}`)}
              style={{ width: '100%', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '1rem', fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer' }}>
              Go to My trades →
            </button>
            <button onClick={() => { setStep('amount'); setAmount(''); setSelected(null); setTradeId(null) }}
              style={{ width: '100%', background: 'none', border: '1.5px solid var(--sand-3)', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer' }}>
              Open another deposit
            </button>
          </div>
        )}

        {/* AMOUNT STEP */}
        {step === 'amount' && (
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="t-subhead" style={{ marginBottom: '0.75rem' }}>Amount to deposit</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink-3)', pointerEvents: 'none' }}>₦</span>
              <input type="number" placeholder="0" value={amount}
                onChange={e => { setAmount(e.target.value); setSelected(null) }}
                style={{ width: '100%', paddingLeft: '2rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', fontFamily: 'var(--font-display)', fontSize: '1.375rem', letterSpacing: '-0.02em', color: 'var(--ink)', background: 'var(--sand)', border: '1.5px solid var(--sand-3)', borderRadius: 'var(--r-sm)', outline: 'none' }} />
            </div>
            {amount && Number(amount) > 0 && (
              <button onClick={() => setStep('vendor')} style={{ marginTop: '0.75rem', width: '100%', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
                Select a vendor →
              </button>
            )}
          </div>
        )}

        {/* VENDOR STEP */}
        {step === 'vendor' && (
          <>
            <div className="card" style={{ padding: '1rem', background: 'var(--sand)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="t-caption">Deposit amount</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(Number(amount))}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="t-subhead" style={{ marginBottom: '0.875rem' }}>Choose vendor</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {filtered.map(v => (
                  <button key={v.id} onClick={() => setSelected(v)}
                    style={{ width: '100%', textAlign: 'left', padding: '0.875rem 1rem', borderRadius: 'var(--r-sm)', border: selected?.id === v.id ? '2px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: selected?.id === v.id ? 'var(--emerald-bg)' : 'var(--white)', cursor: 'pointer', transition: 'all 0.12s' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: selected?.id === v.id ? 'var(--emerald)' : 'var(--ink)', marginBottom: '0.25rem' }}>{v.name}</div>
                    <div className="t-caption">Limit: {formatNaira(v.min_limit)} – {formatNaira(v.max_limit)}</div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="t-caption" style={{ padding: '1rem 0' }}>No vendors available for this amount</div>
                )}
              </div>
              {selected && (
                <GreenButton onClick={initiate} disabled={loading || confirmed}>
                  {loading ? 'Opening trade…' : confirmed ? 'Trade opened…' : `Confirm with ${selected.name}`}
                </GreenButton>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
