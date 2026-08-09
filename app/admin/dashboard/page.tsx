import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira, maskPhone } from '@/lib/format'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [{ count: userCount }, { data: pending }, { data: invested }] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('withdrawals').select('amount').eq('status', 'pending'),
    supabaseAdmin.from('user_plans').select('amount_paid'),
  ])

  const pendingTotal = pending?.reduce((s, w) => s + w.amount, 0) ?? 0
  const totalInvested = invested?.reduce((s, u) => s + u.amount_paid, 0) ?? 0

  const { data: recentUsers } = await supabaseAdmin
    .from('users').select('phone,tier,wallet_balance,total_invested,created_at')
    .order('created_at', { ascending: false }).limit(8)

  const { data: recentWd } = await supabaseAdmin
    .from('withdrawals').select('*, user:users(phone)')
    .order('requested_at', { ascending: false }).limit(6)

  const { data: activePlans } = await supabaseAdmin
    .from('user_plans').select('id', { count: 'exact', head: true }).eq('status', 'active')

  const STATUS_PILL: Record<string, string> = {
    pending: 'pill pill-amber', approved: 'pill pill-emerald',
    paid: 'pill pill-emerald', rejected: 'pill pill-danger',
  }
  const TIER: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }

  const stats = [
    { val: String(userCount ?? 0), lab: 'Total members' },
    { val: formatNaira(totalInvested), lab: 'Total invested' },
    { val: formatNaira(pendingTotal), lab: 'Pending withdrawals' },
    { val: String(pending?.length ?? 0), lab: 'Open requests' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Dashboard</div>
        <div className="t-caption">Platform overview · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {stats.map(({ val, lab }) => (
          <div key={lab} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', color: 'var(--emerald)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>{val}</div>
            <div className="t-label">{lab}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="t-subhead">Recent members</div>
            <Link href="/admin/users" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', textDecoration: 'none' }}>View all</Link>
          </div>
          {recentUsers?.map((u, i) => (
            <div key={u.phone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < (recentUsers.length - 1) ? '1px solid var(--sand-2)' : 'none' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{maskPhone(u.phone)}</div>
                <div className="t-caption">{formatNaira(u.total_invested)} invested</div>
              </div>
              <span className="pill pill-neutral">{TIER[u.tier]}</span>
            </div>
          ))}
          {!recentUsers?.length && <div className="t-caption">No members yet</div>}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="t-subhead">Recent withdrawals</div>
            <Link href="/admin/withdrawals" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', textDecoration: 'none' }}>View all</Link>
          </div>
          {recentWd?.map((w, i) => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < (recentWd.length - 1) ? '1px solid var(--sand-2)' : 'none' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>{formatNaira(w.amount)}</div>
                <div className="t-caption">{maskPhone((w.user as { phone: string })?.phone ?? '')} · {new Date(w.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
              </div>
              <span className={STATUS_PILL[w.status] ?? 'pill pill-neutral'}>{w.status.charAt(0).toUpperCase() + w.status.slice(1)}</span>
            </div>
          ))}
          {!recentWd?.length && <div className="t-caption">No withdrawals yet</div>}
        </div>
      </div>
    </div>
  )
}
