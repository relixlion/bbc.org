import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira } from '@/lib/format'
import Link from 'next/link'

const TYPE_LABEL: Record<string, string> = {
  plan_purchase: 'Plan purchase',
  reward_daily: 'Daily return',
  reward_checkin: 'Check-in reward',
  reward_salary: 'Weekly salary',
  reward_referral: 'Referral commission',
  reward_admin_gift: 'Admin gift',
  reward_fixed: 'Fixed return',
  p2p_deposit: 'Deposit',
  p2p_deposit_admin_settled: 'Deposit confirmed',
  p2p_deposit_auto_settled: 'Deposit settled',
  p2p_withdrawal_lock: 'Withdrawal',
  p2p_withdrawal_refund: 'Withdrawal refund',
  signup_bonus: 'Welcome bonus',
}

export default async function TransactionsPage() {
  const session = await getSession()

  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', session!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const totalIn = transactions?.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0) ?? 0
  const totalOut = transactions?.filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0) ?? 0

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Profile
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>Transactions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total in</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#4ADE80', letterSpacing: '-0.02em' }}>{formatNaira(totalIn)}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total out</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--amber)', letterSpacing: '-0.02em' }}>{formatNaira(totalOut)}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {transactions?.map((t) => (
          <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.125rem' }}>
                {TYPE_LABEL[t.type] ?? t.type}
              </div>
              <div className="t-caption">{t.note ?? ''}</div>
              <div className="t-caption">{new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', letterSpacing: '-0.02em', color: t.direction === 'credit' ? 'var(--emerald)' : 'var(--danger)' }}>
                {t.direction === 'credit' ? '+' : '−'}{formatNaira(t.amount)}
              </div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.direction === 'credit' ? 'var(--emerald-2)' : 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.125rem' }}>
                {t.direction === 'credit' ? 'Credit' : 'Debit'}
              </div>
            </div>
          </div>
        ))}
        {!transactions?.length && (
          <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No transactions yet</div>
        )}
      </div>
    </div>
  )
}