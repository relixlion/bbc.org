import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira, maskPhone } from '@/lib/format'
import CopyButton from './CopyButton'

export default async function TeamPage() {
  const session = await getSession()
  const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', session!.id).single()
  const { data: settings } = await supabaseAdmin.from('admin_settings').select('key,value')
  const sMap: Record<string, unknown> = {}
  settings?.forEach((r) => { sMap[r.key] = r.value })
  const rates = sMap.referral_rates as { l1: number; l2: number; l3: number } ?? { l1: 20, l2: 3, l3: 2 }
  
  const { data: commissions } = await supabaseAdmin.from('rewards').select('amount').eq('user_id', session!.id).eq('type', 'referral')
  const totalComm = commissions?.reduce((s, r) => s + r.amount, 0) ?? 0
  const { data: l1 } = await supabaseAdmin.from('users').select('id,phone,tier,total_invested').eq('referred_by', session!.id)
  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bbc-org.vercel.app'}/register?code=${user?.referral_code}`
  const TIER: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Your team</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Earn commission across 3 levels</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', padding: '1rem 1.25rem 0' }}>
        {[{ val: formatNaira(totalComm), lab: 'Total commissions' }, { val: String(l1?.length ?? 0), lab: 'Direct invites' }].map(({ val, lab }) => (
          <div key={lab} className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{val}</div>
            <div className="t-caption" style={{ marginTop: '0.25rem' }}>{lab}</div>
          </div>
        ))}
      </div>

      {/* Referral box */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.25rem' }}>
          <div className="t-label" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.625rem' }}>Your invite link</div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', wordBreak: 'break-all', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <span style={{ flex: 1 }}>{referralLink}</span>
            <CopyButton text={referralLink} variant="icon" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div className="t-label" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.375rem' }}>Invitation code</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--amber)', letterSpacing: '0.1em' }}>{user?.referral_code}</div>
                <CopyButton text={user?.referral_code ?? ''} variant="code" />
              </div>
            </div>
            </div>
        </div>
      </div>

      {/* Commission rates */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div className="t-subhead" style={{ marginBottom: '0.75rem' }}>Commission rates</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {[{ pct: `${rates.l1}%`, lab: 'Level A', sub: 'Direct' }, { pct: `${rates.l2}%`, lab: 'Level B', sub: '2nd tier' }, { pct: `${rates.l3}%`, lab: 'Level C', sub: '3rd tier' }].map(({ pct, lab, sub }) => (
            <div key={lab} className="card" style={{ textAlign: 'center', padding: '0.875rem 0.5rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{pct}</div>
              <div className="t-label" style={{ marginTop: '0.25rem' }}>{lab}</div>
              <div className="t-caption">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="t-caption">Weekly salary is earned per active plan. Claim it from your rewards tab each week.</div>
        </div>
      </div>

      {/* Members */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        <div className="t-subhead" style={{ marginBottom: '0.75rem' }}>Level A members ({l1?.length ?? 0})</div>
        {l1?.length ? l1.map((m) => (
          <div key={m.id} className="card" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="t-body" style={{ fontWeight: 600 }}>{maskPhone(m.phone)}</div>
            <span className="pill pill-neutral">{TIER[m.tier]}</span>
          </div>
        )) : <div className="t-caption" style={{ textAlign: 'center', padding: '2rem 0' }}>No members yet. Share your invite link.</div>}
      </div>
    </div>
  )
}
