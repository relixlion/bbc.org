'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui'
import { formatNaira, maskPhone } from '@/lib/format'

interface User { id: string; phone: string; tier: string; wallet_balance: number; total_invested: number; is_admin: boolean; created_at: string; referral_code: string }

const TIER: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }
const TIER_PILL: Record<string, string> = { bronze: 'pill pill-neutral', silver: 'pill pill-neutral', gold: 'pill pill-amber', platinum: 'pill pill-emerald' }

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const q = search ? `?search=${search}` : ''
    fetch(`/api/admin/users${q}`).then(r => r.json()).then(d => Array.isArray(d) && setUsers(d))
  }, [search])

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Users</div>
        <div className="t-caption">{users.length} member{users.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <Input label="" placeholder="Search by phone number…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {users.map((u) => (
          <div key={u.id} className="card" style={{ padding: '1.125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{maskPhone(u.phone)}</div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span className={TIER_PILL[u.tier] ?? 'pill pill-neutral'}>{TIER[u.tier]}</span>
                  {u.is_admin && <span style={{ fontSize: '0.625rem', fontWeight: 700, background: '#EDE9FE', color: '#6D28D9', padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)' }}>Admin</span>}
                </div>
              </div>
              <div className="t-caption">{new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.75rem' }}>
                <div className="t-label" style={{ marginBottom: '0.125rem' }}>Balance</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--emerald)' }}>{formatNaira(u.wallet_balance)}</div>
              </div>
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.75rem' }}>
                <div className="t-label" style={{ marginBottom: '0.125rem' }}>Invested</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{formatNaira(u.total_invested)}</div>
              </div>
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.75rem' }}>
                <div className="t-label" style={{ marginBottom: '0.125rem' }}>Ref code</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace' }}>{u.referral_code}</div>
              </div>
            </div>
          </div>
        ))}
        {!users.length && <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No users found</div>}
      </div>
    </div>
  )
}
