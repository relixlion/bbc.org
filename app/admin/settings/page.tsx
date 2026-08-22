'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui'

interface Threshold { amount: number; days: string[] }
interface Settings {
  checkin_amount: number
  referral_rates: { l1: number; l2: number; l3: number }
  withdrawal_thresholds: Threshold[]
  p2p_claim_fees: Record<string, number>
  p2p_rate: number
  p2p_withdrawal_fee_percent: number
  invite_codes: { code1: string; code2: string }
}

const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABEL = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const EMPTY_THRESHOLD: Threshold = { amount: 0, days: ['monday','tuesday','wednesday','thursday','friday'] }

const DEFAULT: Settings = {
  checkin_amount: 80,
  referral_rates: { l1: 20, l2: 3, l3: 2 },
  withdrawal_thresholds: [],
  p2p_claim_fees: { daily: 0, fixed: 0, referral: 0, checkin: 0, salary: 15, admin_gift: 0 },
  p2p_rate: 1600,
  p2p_withdrawal_fee_percent: 10,
  invite_codes: { code1: '', code2: '' },
}

export default function AdminSettings() {
  const [s, setS] = useState<Settings | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      setS({
        checkin_amount: Number(data.checkin_amount ?? DEFAULT.checkin_amount),
        referral_rates: data.referral_rates ?? DEFAULT.referral_rates,
        withdrawal_thresholds: data.withdrawal_thresholds ?? [],
        p2p_claim_fees: data.p2p_claim_fees ?? DEFAULT.p2p_claim_fees,
        p2p_rate: Number(data.p2p_rate ?? DEFAULT.p2p_rate),
        p2p_withdrawal_fee_percent: Number(data.p2p_withdrawal_fee_percent ?? DEFAULT.p2p_withdrawal_fee_percent),
        invite_codes: data.invite_codes ?? DEFAULT.invite_codes,
      })
    })
  }, [])

  async function saveSetting(key: string, value: unknown) {
    setSaving(key)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(null)
    if (res.ok) { setSaved(key); setTimeout(() => setSaved(null), 2000) }
  }

  function SaveBtn({ k, value, label }: { k: string; value: unknown; label?: string }) {
    return (
      <button onClick={() => saveSetting(k, value)} disabled={saving === k}
        style={{ padding: '0.625rem 1.25rem', borderRadius: 'var(--r-sm)', background: saved === k ? 'var(--emerald-bg)' : 'var(--emerald)', color: saved === k ? 'var(--emerald-2)' : 'var(--white)', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: saving === k ? 0.7 : 1, flexShrink: 0 }}>
        {saving === k ? 'Saving…' : saved === k ? '✓ Saved' : label ?? 'Save'}
      </button>
    )
  }

  if (!s) return <div className="t-caption" style={{ padding: '3rem', textAlign: 'center' }}>Loading settings…</div>

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Settings</div>
        <div className="t-caption">Changes save immediately when you click Save</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Admin invite codes */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="t-subhead">Admin invite codes</div>
              <div className="t-caption">These appear on the registration page as quick-select options. Paste your own referral codes here.</div>
            </div>
            <SaveBtn k="invite_codes" value={s.invite_codes} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <Input label="Primary code" placeholder="Your referral code"
              value={s.invite_codes?.code1 ?? ''}
              onChange={e => setS({ ...s, invite_codes: { ...s.invite_codes, code1: e.target.value.toUpperCase() } })} />
            <Input label="Secondary code" placeholder="Your second code"
              value={s.invite_codes?.code2 ?? ''}
              onChange={e => setS({ ...s, invite_codes: { ...s.invite_codes, code2: e.target.value.toUpperCase() } })} />
          </div>
        </div>

        {/* Check-in */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="t-subhead">Daily check-in reward</div>
              <div className="t-caption">Amount users earn per daily check-in</div>
            </div>
            <SaveBtn k="checkin_amount" value={s.checkin_amount} />
          </div>
          <Input label="Amount (₦)" type="number" value={String(s.checkin_amount)}
            onChange={e => setS({ ...s, checkin_amount: Number(e.target.value) })} />
        </div>

        {/* Referral rates */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="t-subhead">Referral commission rates</div>
              <div className="t-caption">Percentage of plan price paid to referrers</div>
            </div>
            <SaveBtn k="referral_rates" value={s.referral_rates} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
            {(['l1','l2','l3'] as const).map((l, i) => (
              <Input key={l} label={`Level ${['A','B','C'][i]} — ${['Direct invite','2nd tier','3rd tier'][i]} (%)`}
                type="number" value={String(s.referral_rates[l])}
                onChange={e => setS({ ...s, referral_rates: { ...s.referral_rates, [l]: Number(e.target.value) } })} />
            ))}
          </div>
        </div>

        {/* P2P Rate */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="t-subhead">P2P exchange rate</div>
              <div className="t-caption">Naira per dollar — used to calculate USDT equivalent</div>
            </div>
            <SaveBtn k="p2p_rate" value={s.p2p_rate} />
          </div>
          <Input label="₦ per $1 USDT" type="number" value={String(s.p2p_rate)}
            onChange={e => setS({ ...s, p2p_rate: Number(e.target.value) })} />
        </div>

        {/* Withdrawal fee */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="t-subhead">Withdrawal fee</div>
              <div className="t-caption">Percentage deducted from every withdrawal request</div>
            </div>
            <SaveBtn k="p2p_withdrawal_fee_percent" value={s.p2p_withdrawal_fee_percent} />
          </div>
          <Input label="Fee (%)" type="number" value={String(s.p2p_withdrawal_fee_percent)}
            onChange={e => setS({ ...s, p2p_withdrawal_fee_percent: Number(e.target.value) })} />
        </div>

        {/* Claim fees */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="t-subhead">Claim fees per reward type</div>
              <div className="t-caption">% deducted when user claims each reward type to wallet</div>
            </div>
            <SaveBtn k="p2p_claim_fees" value={s.p2p_claim_fees} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
            {(['daily','fixed','referral','checkin','salary','admin_gift'] as const).map(type => (
              <Input key={type} label={`${type === 'admin_gift' ? 'Admin gift' : type.charAt(0).toUpperCase() + type.slice(1)} (%)`}
                type="number" value={String(s.p2p_claim_fees?.[type] ?? 0)}
                onChange={e => setS({ ...s, p2p_claim_fees: { ...(s.p2p_claim_fees ?? {}), [type]: Number(e.target.value) } })} />
            ))}
          </div>
        </div>

        {/* Withdrawal thresholds */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
            <div>
              <div className="t-subhead">Withdrawal thresholds</div>
              <div className="t-caption">Fixed amounts users can withdraw. Toggle which days each is available.</div>
            </div>
            <SaveBtn k="withdrawal_thresholds" value={s.withdrawal_thresholds} label="Save all" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {(s.withdrawal_thresholds ?? []).map((t, i) => (
              <div key={i} style={{ background: 'var(--sand)', borderRadius: 'var(--r-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="t-label">Threshold {i + 1}</div>
                  <button onClick={() => {
                    const arr = [...s.withdrawal_thresholds]
                    arr.splice(i, 1)
                    setS({ ...s, withdrawal_thresholds: arr })
                  }} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
                <Input label="Amount (₦)" type="number" value={String(t.amount)}
                  onChange={e => {
                    const arr = [...s.withdrawal_thresholds]
                    arr[i] = { ...arr[i], amount: Number(e.target.value) }
                    setS({ ...s, withdrawal_thresholds: arr })
                  }} />
                <div className="t-label" style={{ marginBottom: '0.5rem' }}>Available days</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {ALL_DAYS.map((d, di) => {
                    const active = t.days.includes(d)
                    return (
                      <button key={d} onClick={() => {
                        const days = active ? t.days.filter(x => x !== d) : [...t.days, d]
                        const arr = [...s.withdrawal_thresholds]
                        arr[i] = { ...arr[i], days }
                        setS({ ...s, withdrawal_thresholds: arr })
                      }} style={{ padding: '0.3rem 0.75rem', borderRadius: 'var(--r-full)', fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: active ? 'var(--emerald)' : 'var(--white)', color: active ? 'var(--white)' : 'var(--ink-3)', boxShadow: active ? 'none' : '0 0 0 1.5px var(--sand-3) inset', transition: 'all 0.12s' }}>
                        {DAY_LABEL[di]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setS({ ...s, withdrawal_thresholds: [...(s.withdrawal_thresholds ?? []), { ...EMPTY_THRESHOLD }] })}
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--r-sm)', border: '1.5px dashed var(--sand-3)', background: 'none', fontSize: '0.875rem', fontWeight: 600, color: 'var(--emerald)', cursor: 'pointer' }}>
            + Add threshold
          </button>
        </div>

      </div>
    </div>
  )
}