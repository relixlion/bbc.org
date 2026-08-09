'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plan } from '@/types'
import { GreenButton, Spinner } from '@/components/ui'
import { formatNaira } from '@/lib/format'



export default function PlanDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [user, setUser] = useState<{ wallet_balance: number; phone: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/plans?id=${id}`).then(r => r.json()).then(d => {
      // fetch single plan
      fetch('/api/plans').then(r => r.json()).then((plans: Plan[]) => {
        const p = plans.find((x) => x.id === id)
        setPlan(p ?? null)
        setLoading(false)
      })
    })
    fetch('/api/auth/me').then(r => r.json()).then(setUser).catch(() => {})
  }, [id])

  async function buyWithWallet() {
    setBuying(true); setError('')
    try {
      const res = await fetch('/api/plans/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: id }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(true)
      setTimeout(() => router.push('/home'), 1500)
    } finally { setBuying(false) }
  }

  

  if (loading) return <div className="pt-16"><Spinner /></div>
  if (!plan) return <div className="p-8 text-center text-[#888]">Plan not found.</div>

  const walletBalance = user?.wallet_balance ?? 0
  const canAfford = walletBalance >= plan.price
  const totalReturn = plan.plan_type === 'daily' ? (plan.daily_return ?? 0) * plan.duration_days : plan.price * (1 + (plan.fixed_return_percent ?? 0) / 100)

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.75rem', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{plan.name}</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>{plan.category} · {plan.plan_type === 'daily' ? 'Daily income' : 'Fixed return'}</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {success && <div className="alert alert-success">Plan activated! Redirecting…</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div className="t-label" style={{ marginBottom: '0.25rem' }}>Plan price</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(plan.price)}</div>
            </div>
            <div>
              <div className="t-label" style={{ marginBottom: '0.25rem' }}>Duration</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{plan.duration_days}d</div>
            </div>
            {plan.plan_type === 'daily' ? (
              <>
                <div>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>Daily return</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(plan.daily_return ?? 0)}</div>
                </div>
                <div>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>Total return</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(totalReturn)}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>Return</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{plan.fixed_return_percent}%</div>
                </div>
                <div>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>At maturity</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(totalReturn)}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="t-label" style={{ marginBottom: '0.25rem' }}>Your wallet balance</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: canAfford ? 'var(--emerald)' : 'var(--danger)', letterSpacing: '-0.02em' }}>{formatNaira(walletBalance)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="t-label" style={{ marginBottom: '0.25rem' }}>Required</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(plan.price)}</div>
            </div>
          </div>

          {!canAfford && (
            <div className="alert alert-warn" style={{ marginBottom: '1rem' }}>
              You need {formatNaira(plan.price - walletBalance)} more to buy this plan.{' '}
              <a href="/deposit" style={{ fontWeight: 700, color: 'var(--emerald)', textDecoration: 'none' }}>Deposit funds →</a>
            </div>
          )}

          <GreenButton onClick={buyWithWallet} disabled={buying || !canAfford}>
            {buying ? 'Processing…' : canAfford ? `Buy plan — ${formatNaira(plan.price)}` : 'Insufficient balance'}
          </GreenButton>
        </div>
      </div>
    </div>
  )
}
