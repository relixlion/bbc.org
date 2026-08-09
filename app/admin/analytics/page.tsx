'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatNaira } from '@/lib/format'

interface Analytics {
  snapshot: {
    total_invested: number
    total_claimed_rewards: number
    total_pending_rewards: number
    total_withdrawn: number
    total_pending_withdrawals: number
    total_wallet_balance: number
    net_position: number
    active_plans_count: number
  }
  obligations: {
    next_30_days: number
    next_60_days: number
    next_90_days: number
    total_remaining: number
  }
  ratios: {
    liquidity_ratio: number
    withdrawal_pressure: number
  }
  by_category: Record<string, { invested: number; obligation: number; count: number }>
  plan_obligations: Array<{
    plan_name: string
    category: string
    plan_type: string
    days_left: number
    daily_return: number
    amount_paid: number
    total_remaining: number
    remaining30: number
    remaining60: number
    remaining90: number
  }>
  settings: {
    checkin_amount: number
    referral_rates: { l1: number; l2: number; l3: number }
    weekly_salary: Record<string, number>
    withdrawal_tiers: Array<{ name: string; label: string; threshold: number }>
  }
}

const CAT_LABEL: Record<string, string> = { bigbrother: 'Big Brother', football: 'Football', forest: 'Forest' }

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'green' | 'amber' | 'red' | 'neutral' }) {
  const color = accent === 'green' ? 'var(--emerald)' : accent === 'amber' ? 'var(--amber)' : accent === 'red' ? 'var(--danger)' : 'var(--ink)'
  return (
    <div className="card" style={{ padding: '1.125rem' }}>
      <div className="t-label" style={{ marginBottom: '0.375rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: sub ? '0.25rem' : 0 }}>{value}</div>
      {sub && <div className="t-caption">{sub}</div>}
    </div>
  )
}

function RatioBar({ value, label, danger }: { value: number; label: string; danger?: boolean }) {
  const pct = Math.min(100, Math.round(value * 100))
  const color = danger ? (pct > 70 ? 'var(--danger)' : pct > 40 ? 'var(--amber)' : 'var(--emerald)') : (pct < 30 ? 'var(--danger)' : pct < 60 ? 'var(--amber)' : 'var(--emerald)')
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div className="t-body" style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color, letterSpacing: '-0.02em' }}>{pct}%</div>
      </div>
      <div style={{ height: 8, background: 'var(--sand-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <div className="t-caption" style={{ marginTop: '0.375rem' }}>
        {danger
          ? (pct > 70 ? 'High pressure — monitor closely' : pct > 40 ? 'Moderate' : 'Low pressure')
          : (pct < 30 ? 'Low coverage — risk' : pct < 60 ? 'Moderate coverage' : 'Healthy coverage')
        }
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Simulator state — starts from live settings, user adjusts
  const [simCheckin, setSimCheckin] = useState(80)
  const [simL1, setSimL1] = useState(20)
  const [simL2, setSimL2] = useState(3)
  const [simL3, setSimL3] = useState(2)
  const [simDailyMultiplier, setSimDailyMultiplier] = useState(100) // 100% = no change

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/analytics')
    const d: Analytics = await res.json()
    setData(d)
    // Seed simulator from live settings
    setSimCheckin(Number(d.settings?.checkin_amount ?? 80))
    setSimL1(Number(d.settings?.referral_rates?.l1 ?? 20))
    setSimL2(Number(d.settings?.referral_rates?.l2 ?? 3))
    setSimL3(Number(d.settings?.referral_rates?.l3 ?? 2))
    setSimDailyMultiplier(100)
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading || !data) {
    return (
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Analytics</div>
        <div className="spinner" />
      </div>
    )
  }

  const { snapshot, obligations, ratios, by_category, plan_obligations } = data

  // Simulated obligation = apply daily multiplier to all daily plans
  const simObligation = plan_obligations.reduce((s, p) => {
    if (p.plan_type === 'daily') return s + (p.total_remaining * simDailyMultiplier / 100)
    return s + p.total_remaining
  }, 0)
  const simObligationDelta = simObligation - obligations.total_remaining

  // Simulated referral cost (approximate — % of total invested)
  const baseReferralCost = snapshot.total_invested * ((20 + 3 + 2) / 100)
  const simReferralCost = snapshot.total_invested * ((simL1 + simL2 + simL3) / 100)
  const referralDelta = simReferralCost - baseReferralCost

  // Simulated checkin cost (active users × 30 days)
  const userCount = Object.values(by_category).reduce((s, c) => s + c.count, 0) || 1
  const simCheckinCost30 = userCount * simCheckin * 30
  const baseCheckinCost30 = userCount * Number(data.settings?.checkin_amount ?? 80) * 30
  const checkinDelta = simCheckinCost30 - baseCheckinCost30

  function deltaStyle(delta: number) {
    if (delta === 0) return 'var(--ink-3)'
    return delta > 0 ? 'var(--danger)' : 'var(--emerald)'
  }
  function deltaLabel(delta: number) {
    if (delta === 0) return 'No change'
    return `${delta > 0 ? '+' : ''}${formatNaira(delta)} vs current`
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Analytics</div>
          <div className="t-caption">
            {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}
          </div>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.125rem', borderRadius: 'var(--r-md)', background: 'var(--emerald)', color: 'var(--white)', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      {/* Snapshot */}
      <div style={{ marginBottom: '0.5rem' }} className="t-label">Platform snapshot</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total invested" value={formatNaira(snapshot.total_invested)} accent="neutral" />
        <StatCard label="Total withdrawn" value={formatNaira(snapshot.total_withdrawn)} accent="neutral" />
        <StatCard label="Net position" value={formatNaira(snapshot.net_position)} sub="Invested minus withdrawn" accent={snapshot.net_position >= 0 ? 'green' : 'red'} />
        <StatCard label="Wallet balances" value={formatNaira(snapshot.total_wallet_balance)} sub="Across all members" accent="neutral" />
        <StatCard label="Rewards paid out" value={formatNaira(snapshot.total_claimed_rewards)} accent="neutral" />
        <StatCard label="Pending rewards" value={formatNaira(snapshot.total_pending_rewards)} sub="Earned, unclaimed" accent="amber" />
        <StatCard label="Pending withdrawals" value={formatNaira(snapshot.total_pending_withdrawals)} sub={`${data.plan_obligations.length} active plans`} accent="amber" />
        <StatCard label="Active plans" value={String(snapshot.active_plans_count)} sub="Currently running" accent="neutral" />
      </div>

      {/* Obligations */}
      <div style={{ marginBottom: '0.5rem' }} className="t-label">Payout obligations</div>
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div className="t-subhead" style={{ marginBottom: '1rem' }}>Projected returns owed to members</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Next 30 days', val: obligations.next_30_days },
            { label: 'Next 60 days', val: obligations.next_60_days },
            { label: 'Next 90 days', val: obligations.next_90_days },
            { label: 'Total remaining', val: obligations.total_remaining },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.875rem' }}>
              <div className="t-label" style={{ marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(val)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(by_category).length > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div className="t-subhead" style={{ marginBottom: '1rem' }}>Obligations by category</div>
          {Object.entries(by_category).map(([cat, d]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--sand-2)' }}>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{CAT_LABEL[cat] ?? cat}</div>
                <div className="t-caption">{d.count} active plan{d.count !== 1 ? 's' : ''} · {formatNaira(d.invested)} invested</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(d.obligation)}</div>
                <div className="t-caption">owed</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Health ratios */}
      <div style={{ marginBottom: '0.5rem' }} className="t-label">Platform health</div>
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <RatioBar
          value={ratios.liquidity_ratio}
          label="Liquidity coverage — wallet balances vs total obligations"
        />
        <RatioBar
          value={ratios.withdrawal_pressure}
          label="Withdrawal pressure — pending withdrawals vs wallet balances"
          danger
        />
      </div>

      {/* Rate simulator */}
      <div style={{ marginBottom: '0.5rem' }} className="t-label">Rate impact simulator</div>
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <div className="t-subhead">Adjust rates — see impact instantly</div>
          <button onClick={load} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset to live</button>
        </div>
        <div className="t-caption" style={{ marginBottom: '1.25rem' }}>Changes here are simulation only — they do not save to settings</div>

        {/* Daily return multiplier */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>Daily return multiplier</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: simDailyMultiplier < 100 ? 'var(--emerald)' : simDailyMultiplier > 100 ? 'var(--danger)' : 'var(--ink)', letterSpacing: '-0.01em' }}>{simDailyMultiplier}%</div>
          </div>
          <input type="range" min={50} max={200} step={5} value={simDailyMultiplier} onChange={e => setSimDailyMultiplier(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--emerald)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
            <span className="t-caption">50% (cut in half)</span>
            <span className="t-caption">200% (double)</span>
          </div>
          <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.875rem', background: 'var(--sand)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-caption">Obligation impact</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: deltaStyle(simObligationDelta) }}>{deltaLabel(simObligationDelta)}</span>
          </div>
        </div>

        {/* Referral rates */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.75rem' }}>Referral commission rates (%)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Level A', val: simL1, set: setSimL1, max: 40 },
              { label: 'Level B', val: simL2, set: setSimL2, max: 20 },
              { label: 'Level C', val: simL3, set: setSimL3, max: 10 },
            ].map(({ label, val, set, max }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span className="t-caption">{label}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{val}%</span>
                </div>
                <input type="range" min={0} max={max} step={0.5} value={val} onChange={e => set(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--emerald)' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem', background: 'var(--sand)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-caption">Referral cost impact (est.)</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: deltaStyle(referralDelta) }}>{deltaLabel(referralDelta)}</span>
          </div>
        </div>

        {/* Check-in amount */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>Daily check-in reward</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{formatNaira(simCheckin)}</div>
          </div>
          <input type="range" min={0} max={500} step={10} value={simCheckin} onChange={e => setSimCheckin(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--emerald)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
            <span className="t-caption">₦0</span>
            <span className="t-caption">₦500</span>
          </div>
          <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.875rem', background: 'var(--sand)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-caption">30-day check-in cost (est.)</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: deltaStyle(checkinDelta) }}>{deltaLabel(checkinDelta)}</span>
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--sand-2)', paddingTop: '1.25rem' }}>
          <div className="t-subhead" style={{ marginBottom: '0.75rem' }}>Simulation summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.875rem' }}>
              <div className="t-label" style={{ marginBottom: '0.25rem' }}>Current total obligation</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(obligations.total_remaining)}</div>
            </div>
            <div style={{ background: simObligationDelta < 0 ? 'var(--emerald-bg)' : simObligationDelta > 0 ? 'var(--danger-bg)' : 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.875rem', border: simObligationDelta !== 0 ? `1px solid ${simObligationDelta < 0 ? '#B7DFD0' : '#F5C6C2'}` : 'none' }}>
              <div className="t-label" style={{ marginBottom: '0.25rem' }}>Simulated obligation</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: deltaStyle(simObligationDelta), letterSpacing: '-0.02em' }}>{formatNaira(simObligation)}</div>
            </div>
          </div>
          {(simObligationDelta !== 0 || referralDelta !== 0 || checkinDelta !== 0) && (
            <div style={{ marginTop: '0.75rem', padding: '0.875rem 1rem', background: simObligationDelta + referralDelta + checkinDelta < 0 ? 'var(--emerald-bg)' : 'var(--danger-bg)', borderRadius: 'var(--r-sm)', border: `1px solid ${simObligationDelta + referralDelta + checkinDelta < 0 ? '#B7DFD0' : '#F5C6C2'}` }}>
              <div className="t-caption" style={{ marginBottom: '0.25rem' }}>Combined estimated impact</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: deltaStyle(simObligationDelta + referralDelta + checkinDelta) }}>
                {deltaLabel(simObligationDelta + referralDelta + checkinDelta)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per plan table */}
      {plan_obligations.length > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div className="t-subhead" style={{ marginBottom: '1rem' }}>Active plan obligations</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--sand-2)' }}>
                  {['Plan', 'Type', 'Days left', 'Daily return', 'Invested', 'Remaining owed'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--ink-3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan_obligations.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--sand-2)' }}>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: 'var(--ink)' }}>{p.plan_name}</td>
                    <td style={{ padding: '0.625rem 0.75rem' }}><span className={`pill ${p.plan_type === 'daily' ? 'pill-emerald' : 'pill-amber'}`}>{p.plan_type}</span></td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--ink-2)' }}>{p.days_left}d</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--ink-2)' }}>{p.plan_type === 'daily' ? formatNaira(p.daily_return) : '—'}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--ink-2)' }}>{formatNaira(p.amount_paid)}</td>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: 'var(--emerald)', fontFamily: 'var(--font-display)', fontSize: '0.9375rem' }}>{formatNaira(p.total_remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
