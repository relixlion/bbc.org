'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui'
import { maskPhone } from '@/lib/format'

interface UserRow { id: string; phone: string; tier: string; wallet_balance: number }

const TIER: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }
const TIER_PILL: Record<string, string> = { bronze: 'pill pill-neutral', silver: 'pill pill-neutral', gold: 'pill pill-amber', platinum: 'pill pill-emerald' }

export default function AdminGiftRewards() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [sending, setSending] = useState(false)
  const [gifted, setGifted] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [preloaded, setPreloaded] = useState(false)

  useEffect(() => {
    const q = search ? `?search=${search}` : ''
    fetch(`/api/admin/users${q}`).then(r => r.json()).then((d: UserRow[]) => {
      if (Array.isArray(d)) {
        setUsers(d)
        if (!preloaded) {
          const params = new URLSearchParams(window.location.search)
          const uid = params.get('user_id')
          if (uid) {
            const match = d.find(u => u.id === uid)
            if (match) { setSelected(match); setPreloaded(true) }
          }
        }
      }
    })
  }, [search])

  async function gift() {
    if (!selected || !amount) return
    setSending(true); setError(''); setSuccess('')
    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selected.id, amount: Number(amount), label: label || 'Admin gift' })
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setSuccess(`₦${Number(amount).toLocaleString()} gifted to ${maskPhone(selected.phone)}`)
      setGifted(true)
      setAmount('')
      setLabel('')
    }
    setSending(false)
  }

  function reset() {
    setSelected(null)
    setGifted(false)
    setSuccess('')
    setError('')
    setAmount('')
    setLabel('')
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Gift rewards</div>
        <div className="t-caption">Credit a reward directly to any member's pending rewards tab</div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{success}</span>
          <button onClick={reset} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--emerald-2)', background: 'none', border: 'none', cursor: 'pointer' }}>Gift another</button>
        </div>
      )}
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {!gifted && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="t-subhead" style={{ marginBottom: '1rem' }}>Select member</div>
            <Input label="Search by phone" placeholder="0801…" value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {users.slice(0, 20).map((u) => (
                <button key={u.id} onClick={() => { setSelected(u); setGifted(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.75rem 0.875rem', borderRadius: 'var(--r-sm)', border: selected?.id === u.id ? '1.5px solid var(--emerald)' : '1.5px solid transparent', background: selected?.id === u.id ? 'var(--emerald-bg)' : 'var(--sand)', cursor: 'pointer', transition: 'all 0.12s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: selected?.id === u.id ? 'var(--emerald)' : 'var(--ink)' }}>{maskPhone(u.phone)}</span>
                  <span className={TIER_PILL[u.tier] ?? 'pill pill-neutral'}>{TIER[u.tier]}</span>
                </button>
              ))}
              {!users.length && <div className="t-caption" style={{ padding: '1rem 0' }}>No users found</div>}
            </div>
          </div>

          {selected && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="t-subhead" style={{ marginBottom: '0.25rem' }}>Gift to {maskPhone(selected.phone)}</div>
              <div className="t-caption" style={{ marginBottom: '1.25rem' }}>{TIER[selected.tier]} member</div>
              <Input label="Amount (₦)" type="number" placeholder="e.g. 1000" value={amount} onChange={e => setAmount(e.target.value)} />
              <Input label="Label shown to user" placeholder="e.g. Promo bonus, Milestone reward…" value={label} onChange={e => setLabel(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                <button onClick={gift} disabled={sending || !amount}
                  style={{ background: !amount || sending ? 'var(--sand-2)' : 'var(--emerald)', color: !amount || sending ? 'var(--ink-4)' : 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: !amount ? 'default' : 'pointer', transition: 'all 0.12s' }}>
                  {sending ? 'Sending…' : amount ? `Gift ₦${Number(amount).toLocaleString()}` : 'Enter amount'}
                </button>
                <button onClick={reset} style={{ padding: '0 1rem', borderRadius: 'var(--r-md)', border: '1.5px solid var(--sand-3)', background: 'none', fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
