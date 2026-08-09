import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { formatNaira, maskPhone } from '@/lib/format'
import LogoutButton from './LogoutButton'

const TIER: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }

const MENU = [
  { href: '/deposit', label: 'Deposit', sub: 'Add funds to your wallet',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: '/withdraw-p2p', label: 'Withdraw', sub: 'Request a payout',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: '/profile/rewards', label: 'Rewards', sub: 'Claim your pending earnings',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { href: '/profile/bank', label: 'Bank account', sub: 'Manage withdrawal account',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { href: '/profile/checkin', label: 'Daily check-in', sub: 'Earn every day you check in',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { href: '/team', label: 'Referrals', sub: 'Invite members, earn commissions',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/trades', label: 'My trades', sub: 'Track deposits and withdrawals',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
]

export default async function ProfilePage() {
  const session = await getSession()
  const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', session!.id).single()
  const { data: pending } = await supabaseAdmin.from('rewards').select('amount').eq('user_id', session!.id).eq('status', 'pending')
  const pendingTotal = pending?.reduce((s, r) => s + r.amount, 0) ?? 0

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Profile header */}
      <div style={{ background: 'var(--emerald)', padding: '2rem 1.25rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--white)' }}>{(user?.phone ?? '').slice(0, 2)}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--white)', letterSpacing: '-0.01em', marginBottom: '0.25rem' }}>{maskPhone(user?.phone ?? '')}</div>
        <div style={{ display: 'inline-block', background: 'var(--amber)', color: 'var(--white)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', padding: '0.25rem 0.875rem', borderRadius: 'var(--r-full)', marginTop: '0.375rem' }}>
          {TIER[user?.tier ?? 'bronze']?.toUpperCase()} MEMBER
        </div>

        <div className="stat-row" style={{ marginTop: '1.25rem' }}>
          <div className="stat-cell">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Balance</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>{formatNaira(user?.wallet_balance ?? 0)}</div>
          </div>
          <div className="stat-cell">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pending rewards</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--amber)', letterSpacing: '-0.02em' }}>{formatNaira(pendingTotal)}</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {MENU.map(({ href, label, sub, icon }) => (
          <Link key={href} href={href} className="menu-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div>
                <div className="t-body" style={{ fontWeight: 600 }}>{label}</div>
                <div className="t-caption">{sub}</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
          </Link>
        ))}
        <LogoutButton />
      </div>
    </div>
  )
}
