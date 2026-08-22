import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira, maskPhone } from '@/lib/format'
import Link from 'next/link'
import OnboardingModal from './OnboardingModal'
import DateGreeting from './DateGreeting'

const TIER_LABEL: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }

export default async function HomePage() {
  const session = await getSession()
  const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', session!.id).single()
  const { data: activePlans } = await supabaseAdmin.from('user_plans').select('*, plan:plans(*)').eq('user_id', session!.id).eq('status', 'active').limit(3)
  const { data: todayRewards } = await supabaseAdmin.from('rewards').select('amount').eq('user_id', session!.id).eq('status', 'pending').gte('created_at', new Date().toISOString().split('T')[0])
  const todayTotal = todayRewards?.reduce((s, r) => s + r.amount, 0) ?? 0
  const { data: communityPosts } = await supabaseAdmin.from('community_posts').select('*, user:users(phone)').eq('status', 'visible').order('created_at', { ascending: false }).limit(3)

  const { data: checkinSetting } = await supabaseAdmin.from('admin_settings').select('value').eq('key', 'checkin_amount').single()
  const checkinAmount = Number(checkinSetting?.value ?? 80)

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <OnboardingModal />
      {/* Header */}
      <div style={{ background: 'var(--emerald)', padding: '1rem 1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>B.B Cooperative</div>
          <Link href="/profile" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>
        </div>

        <DateGreeting />

        {/* Balance strip */}
        <div className="stat-row">
          <div className="stat-cell">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Balance</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>{formatNaira(user?.wallet_balance ?? 0)}</div>
          </div>
          <div className="stat-cell">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pending today</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', color: 'var(--amber)', letterSpacing: '-0.02em' }}>+{formatNaira(todayTotal)}</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div className="t-label" style={{ marginBottom: '0.75rem' }}>Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
          {[
            { href: '/deposit', label: 'Deposit', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
            { href: '/withdraw-p2p', label: 'Withdraw', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
            { href: '/profile/rewards', label: 'Rewards', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
            { href: '/profile/checkin', label: 'Check in', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} style={{ background: 'var(--white)', border: '1px solid var(--sand-3)', borderRadius: 'var(--r-md)', padding: '0.875rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', background: 'var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '0.01em' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Check-in strip */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <Link href="/profile/checkin" style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--white)', marginBottom: '0.125rem' }}>Daily check-in</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Earn ₦{checkinAmount.toLocaleString()} — complete today's task</div>
          </div>
          <div style={{ background: 'var(--amber)', color: 'var(--white)', fontSize: '0.8125rem', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: 'var(--r-sm)' }}>Check in</div>
        </Link>
      </div>

      {/* Tier card */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-label" style={{ marginBottom: '0.25rem' }}>Your tier</div>
            <div className="t-subhead">{TIER_LABEL[user?.tier ?? 'bronze']}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="t-label" style={{ marginBottom: '0.25rem' }}>Total invested</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--emerald)' }}>{formatNaira(user?.total_invested ?? 0)}</div>
          </div>
        </div>
      </div>

      {/* Active plans */}
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="t-subhead">Active plans</span>
          <Link href="/products" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', textDecoration: 'none' }}>Browse plans</Link>
        </div>

        {activePlans?.length ? activePlans.map((up) => {
          const plan = up.plan as { name: string; daily_return: number | null; duration_days: number; plan_type: string; category: string }
          const daysLeft = Math.max(0, Math.ceil((new Date(up.end_date).getTime() - Date.now()) / 86400000))
          const daysIn = plan.duration_days - daysLeft
          return (
            <Link key={up.id} href={`/products/${(up.plan as {id:string})?.id ?? ''}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '0.625rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div className="t-subhead">{plan.name}</div>
                  <div className="t-caption" style={{ marginTop: '0.125rem' }}>Day {daysIn} of {plan.duration_days} · {daysLeft} remaining</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="t-label">Invested</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{formatNaira(up.amount_paid)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <span className="pill pill-emerald">Active</span>
                {plan.daily_return && <span className="pill pill-amber">{formatNaira(plan.daily_return)}/day</span>}
              </div>
            </div>
            </Link>
          )
        }) : (
          <Link href="/products" style={{ display: 'block', border: '1.5px dashed var(--sand-3)', borderRadius: 'var(--r-lg)', padding: '1.5rem', textAlign: 'center', textDecoration: 'none' }}>
            <div className="t-body" style={{ marginBottom: '0.25rem' }}>No active plans yet</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)' }}>Browse investment plans →</div>
          </Link>
        )}
      </div>

      {/* Community */}
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="t-subhead">Community wins</span>
          <Link href="/community" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', textDecoration: 'none' }}>See all</Link>
        </div>
        {communityPosts?.map((post) => {
          const phone = (post.user as { phone: string })?.phone ?? ''
          return (
            <div key={post.id} className="card" style={{ marginBottom: '0.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white)' }}>{maskPhone(phone).slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <div className="t-body" style={{ fontWeight: 600 }}>{maskPhone(phone)}</div>
                  <div className="t-caption">{new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
              <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-sm)', padding: '1rem', textAlign: 'center' }}>
                <div className="t-label" style={{ color: 'var(--emerald-2)', marginBottom: '0.25rem' }}>Withdrawal confirmed</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(post.amount_shown ?? 0)}</div>
              </div>
            </div>
          )
        })}
        {!communityPosts?.length && <div className="t-caption" style={{ textAlign: 'center', padding: '1.5rem 0' }}>No posts yet</div>}
      </div>
    </div>
  )
}
