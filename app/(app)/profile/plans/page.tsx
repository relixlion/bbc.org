import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'
import Link from 'next/link'

export default async function PlansPage() {
  const session = await getSession()

  const { data: userPlans } = await supabaseAdmin
    .from('user_plans')
    .select('*, plan:plans(*)')
    .eq('user_id', session!.id)
    .order('created_at', { ascending: false })

  const active = userPlans?.filter(p => p.status === 'active') ?? []
  const completed = userPlans?.filter(p => p.status !== 'active') ?? []

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Profile
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>My plans</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>{active.length} active · {completed.length} completed</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {active.length > 0 && (
          <div>
            <div className="t-label" style={{ marginBottom: '0.75rem' }}>Active</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {active.map(up => {
                const plan = up.plan as { name: string; plan_type: string; daily_return: number | null; fixed_return_percent: number | null; duration_days: number; category: string }
                const daysLeft = Math.max(0, Math.ceil((new Date(up.end_date).getTime() - Date.now()) / 86400000))
                const daysIn = plan.duration_days - daysLeft
                const pct = Math.min(100, Math.round((daysIn / plan.duration_days) * 100))
                const totalReturn = plan.plan_type === 'daily'
                  ? (plan.daily_return ?? 0) * plan.duration_days
                  : up.amount_paid * (1 + (plan.fixed_return_percent ?? 0) / 100)
                const earned = plan.plan_type === 'daily' ? (plan.daily_return ?? 0) * daysIn : 0

                return (
                  <div key={up.id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.125rem' }}>{plan.name}</div>
                        <div className="t-caption" style={{ textTransform: 'capitalize' }}>{plan.category} · {plan.plan_type}</div>
                      </div>
                      <span className="pill pill-emerald">Active</span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span className="t-caption">Day {daysIn} of {plan.duration_days}</span>
                        <span className="t-caption">{daysLeft} days left</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--sand-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--emerald)', borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem' }}>
                        <div className="t-label" style={{ marginBottom: '0.125rem' }}>Invested</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{formatNaira(up.amount_paid)}</div>
                      </div>
                      {plan.plan_type === 'daily' ? (
                        <>
                          <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem' }}>
                            <div className="t-label" style={{ marginBottom: '0.125rem' }}>Per day</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--emerald)', letterSpacing: '-0.01em' }}>{formatNaira(plan.daily_return ?? 0)}</div>
                          </div>
                          <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem' }}>
                            <div className="t-label" style={{ marginBottom: '0.125rem' }}>Earned</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--emerald)', letterSpacing: '-0.01em' }}>{formatNaira(earned)}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem' }}>
                            <div className="t-label" style={{ marginBottom: '0.125rem' }}>Return</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--emerald)', letterSpacing: '-0.01em' }}>{plan.fixed_return_percent}%</div>
                          </div>
                          <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem' }}>
                            <div className="t-label" style={{ marginBottom: '0.125rem' }}>At maturity</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', color: 'var(--emerald)', letterSpacing: '-0.01em' }}>{formatNaira(totalReturn)}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="t-caption" style={{ marginTop: '0.75rem' }}>
                      {new Date(up.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → {new Date(up.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <div className="t-label" style={{ marginBottom: '0.75rem' }}>Completed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {completed.map(up => {
                const plan = up.plan as { name: string; plan_type: string; daily_return: number | null; fixed_return_percent: number | null; duration_days: number }
                const totalReturn = plan.plan_type === 'daily'
                  ? (plan.daily_return ?? 0) * plan.duration_days
                  : up.amount_paid * (1 + (plan.fixed_return_percent ?? 0) / 100)
                return (
                  <div key={up.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.125rem' }}>{plan.name}</div>
                      <div className="t-caption">{new Date(up.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → {new Date(up.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="t-caption">{formatNaira(up.amount_paid)} invested</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--emerald)', letterSpacing: '-0.01em' }}>{formatNaira(totalReturn)}</div>
                      <div className="t-caption">total return</div>
                      <span className="pill pill-neutral" style={{ marginTop: '0.25rem' }}>Done</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!userPlans?.length && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="t-body" style={{ marginBottom: '0.5rem' }}>No plans yet</div>
            <Link href="/products" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--emerald)', textDecoration: 'none' }}>Browse investment plans →</Link>
          </div>
        )}
      </div>
    </div>
  )
}