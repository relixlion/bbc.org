'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/format'
import { GreenButton } from '@/components/ui'

interface Vendor { id: string; name: string; min_limit: number; max_limit: number }

export default function DepositPage() {
  const router = useRouter()
  const [step, setStep] = useState<'amount' | 'vendor' | 'confirm' | 'paying'>('amount')
  const [amount, setAmount] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [trade, setTrade] = useState<Record<string, unknown> | null>(null)
  const [vendor, setVendor] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    setLoading(false)
    router.push(`/trades/${data.trade.id}`)
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.75rem', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Deposit funds</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Add money to your wallet</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div className="alert alert-error">{error}</div>}

        {(step === 'amount' || step === 'vendor') && (
          <>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="t-subhead" style={{ marginBottom: '0.75rem' }}>Amount to deposit</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink-3)', pointerEvents: 'none' }}>₦</span>
                <input type="number" placeholder="0" value={amount}
                  onChange={e => { setAmount(e.target.value); setStep('amount') }}
                  style={{ width: '100%', paddingLeft: '2rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', fontFamily: 'var(--font-display)', fontSize: '1.375rem', letterSpacing: '-0.02em', color: 'var(--ink)', background: 'var(--sand)', border: '1.5px solid var(--sand-3)', borderRadius: 'var(--r-sm)', outline: 'none' }} />
              </div>
              {amount && Number(amount) > 0 && (
                <button onClick={() => setStep('vendor')} style={{ marginTop: '0.75rem', width: '100%', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
                  Select a vendor →
                </button>
              )}
            </div>

            {step === 'vendor' && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <div className="t-subhead" style={{ marginBottom: '0.875rem' }}>Choose vendor</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {vendors.filter(v => Number(amount) >= v.min_limit && Number(amount) <= v.max_limit).map(v => (
                    <button key={v.id} onClick={() => setSelected(v)}
                      style={{ width: '100%', textAlign: 'left', padding: '0.875rem 1rem', borderRadius: 'var(--r-sm)', border: selected?.id === v.id ? '2px solid var(--emerald)' : '1.5px solid var(--sand-3)', background: selected?.id === v.id ? 'var(--emerald-bg)' : 'var(--white)', cursor: 'pointer', transition: 'all 0.12s' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: selected?.id === v.id ? 'var(--emerald)' : 'var(--ink)', marginBottom: '0.25rem' }}>{v.name}</div>
                      <div className="t-caption">Limit: {formatNaira(v.min_limit)} – {formatNaira(v.max_limit)}</div>
                    </button>
                  ))}
                  {vendors.filter(v => Number(amount) >= v.min_limit && Number(amount) <= v.max_limit).length === 0 && (
                    <div className="t-caption" style={{ padding: '1rem 0' }}>No vendors available for this amount</div>
                  )}
                </div>
                {selected && (
                  <GreenButton onClick={initiate} disabled={loading} className="mt-4">
                    {loading ? 'Creating trade…' : `Confirm with ${selected.name}`}
                  </GreenButton>
                )}
              </div>
            )}
          </>
        )}

        {step === 'paying' && trade && vendor && (
          <div>
            <div className="alert alert-warn">
              Transfer exactly {formatNaira(trade.naira_amount as number)} to the account below. Your wallet will be credited once confirmed.
            </div>
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <div className="t-subhead" style={{ marginBottom: '1rem' }}>Pay to this account</div>
              <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-md)', padding: '1.25rem', color: 'var(--white)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>{vendor.bank_name as string}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--white)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{vendor.account_number as string}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{vendor.account_name as string}</div>
              </div>
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="t-caption">Amount to transfer</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(trade.naira_amount as number)}</div>
              </div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="t-label" style={{ marginBottom: '0.5rem' }}>What happens next</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  'Transfer the exact amount shown above',
                  'Vendor confirms receipt and credits your account',
                  'Your wallet is updated automatically',
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--emerald)', color: 'var(--white)', fontSize: '0.6875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div className="t-body">{s}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => router.push(`/trades/${trade.id}`)} style={{ width: '100%', marginTop: '1rem', background: 'none', border: '1.5px solid var(--sand-3)', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--emerald)', cursor: 'pointer' }}>
              View trade status →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}