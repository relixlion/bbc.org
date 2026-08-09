import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { formatNaira } from '@/lib/format'

const CATS = [{ key: 'all', label: 'All' }, { key: 'bigbrother', label: 'Big Brother' }, { key: 'football', label: 'Football' }, { key: 'forest', label: 'Forest' }]
const CAT_COLOR: Record<string, string> = { bigbrother: 'var(--emerald)', football: '#92400E', forest: '#166534' }

export default async function ProductsPage({ searchParams }: { searchParams: { cat?: string; type?: string } }) {
  const cat = searchParams.cat ?? 'all'
  const type = searchParams.type ?? 'daily'
  let q = supabaseAdmin.from('plans').select('*').eq('is_active', true).eq('plan_type', type).order('price')
  if (cat !== 'all') q = q.eq('category', cat)
  const { data: plans } = await q

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>B.B Cooperative</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--white)', marginBottom: '0.25rem' }}>Investment plans</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Choose a plan to grow your money</div>
      </div>

      <div style={{ background: 'var(--white)', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--sand-2)' }}>
        <div className="scroll-row">
          {CATS.map(({ key, label }) => (
            <Link key={key} href={`/products?cat=${key}&type=${type}`} className={`chip ${cat === key ? 'chip-active' : 'chip-passive'}`}>{label}</Link>
          ))}
        </div>
      </div>

      <div className="tab-row">
        {['daily', 'fixed'].map((t) => (
          <Link key={t} href={`/products?cat=${cat}&type=${t}`} className={`tab-item ${type === t ? 'active' : ''}`}>
            {t === 'daily' ? 'Daily income' : 'Fixed term'}
          </Link>
        ))}
      </div>

      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {plans?.map((plan) => {
          const totalReturn = plan.plan_type === 'daily'
            ? (plan.daily_return ?? 0) * plan.duration_days
            : plan.price * (1 + (plan.fixed_return_percent ?? 0) / 100)
          return (
            <div key={plan.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '0.875rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: CAT_COLOR[plan.category] ?? 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--white)' }}>{plan.name.slice(0,2).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="t-subhead">{plan.name}</div>
                  <div className="t-caption" style={{ marginTop: '0.125rem' }}>{plan.category} · {plan.plan_type === 'daily' ? 'Daily payout' : 'Fixed return'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="t-label">From</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>{formatNaira(plan.price)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', borderTop: '1px solid var(--sand-2)', paddingTop: '0.875rem', marginBottom: '0.875rem' }}>
                {plan.plan_type === 'daily' ? (
                  <>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--emerald)' }}>{formatNaira(plan.daily_return ?? 0)}</div><div className="t-label" style={{ marginTop: '2px' }}>Daily</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--emerald)' }}>{formatNaira(totalReturn)}</div><div className="t-label" style={{ marginTop: '2px' }}>Total return</div></div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--emerald)' }}>{plan.fixed_return_percent}%</div><div className="t-label" style={{ marginTop: '2px' }}>Return</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--emerald)' }}>{formatNaira(totalReturn)}</div><div className="t-label" style={{ marginTop: '2px' }}>At maturity</div></div>
                  </>
                )}
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--emerald)' }}>{plan.duration_days}</div><div className="t-label" style={{ marginTop: '2px' }}>Days</div></div>
              </div>

              <Link href={`/products/${plan.id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Buy plan</Link>
            </div>
          )
        })}
        {!plans?.length && <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No plans in this category yet.</div>}
      </div>
    </div>
  )
}
