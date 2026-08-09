'use client'
import { useEffect, useState } from 'react'
import { GreenButton, Input } from '@/components/ui'
import bcrypt from 'bcryptjs'

interface Vendor {
  id: string; name: string; phone: string; bank_name: string
  account_number: string; account_name: string; usdt_address: string
  min_limit: number; max_limit: number; is_active: boolean; created_at: string
}

const EMPTY = { name: '', phone: '', password: '', bank_name: '', account_number: '', account_name: '', usdt_address: '', min_limit: '', max_limit: '', role: 'both' }

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => fetch('/api/admin/vendors').then(r => r.json()).then(d => Array.isArray(d) && setVendors(d))
  useEffect(() => { load() }, [])

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function save() {
    setError(''); setSaving(true)
    const res = await fetch('/api/admin/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, min_limit: Number(form.min_limit), max_limit: Number(form.max_limit) }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setForm({ ...EMPTY }); setShowForm(false); setSaving(false); load()
  }

  async function toggle(id: string, is_active: boolean) {
    await fetch('/api/admin/vendors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Vendors</div>
          <div className="t-caption">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} registered</div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ padding: '0.625rem 1.25rem', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
            + Add vendor
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1.5px solid var(--emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div className="t-subhead">New vendor</div>
            <button onClick={() => { setShowForm(false); setError('') }} style={{ fontSize: '0.8125rem', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <Input label="Full name" placeholder="Vendor name" value={form.name} onChange={f('name')} />
            <Input label="Phone number" type="tel" placeholder="08012345678" value={form.phone} onChange={f('phone')} />
            <Input label="Temporary password" type="password" placeholder="They can change later" value={form.password} onChange={f('password')} />
            <Input label="Bank name" placeholder="Access Bank" value={form.bank_name} onChange={f('bank_name')} />
            <Input label="Account number" placeholder="10 digits" value={form.account_number} onChange={f('account_number')} />
            <Input label="Account name" placeholder="As on bank" value={form.account_name} onChange={f('account_name')} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="USDT wallet address (TRC-20)" placeholder="T..." value={form.usdt_address} onChange={f('usdt_address')} />
            </div>
            <Input label="Min limit (₦)" type="number" placeholder="5000" value={form.min_limit} onChange={f('min_limit')} />
            <Input label="Max limit (₦)" type="number" placeholder="500000" value={form.max_limit} onChange={f('max_limit')} />
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="input-label" style={{ marginBottom: '0.5rem' }}>Vendor role</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['buyer','seller','both'].map(r => (
                  <button key={r} onClick={() => setForm(p => ({ ...p, role: r }))}
                    style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: form.role === r ? 'var(--emerald)' : 'var(--sand)', color: form.role === r ? 'var(--white)' : 'var(--ink-3)', transition: 'all 0.12s' }}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <div className="t-caption" style={{ marginTop: '0.375rem' }}>Buyer pays users on withdrawals · Seller receives USDT on deposits · Both does both</div>
            </div>
          </div>
          <GreenButton onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create vendor account'}</GreenButton>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {vendors.map(v => (
          <div key={v.id} className="card" style={{ padding: '1.125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{v.name}</div>
                <div className="t-caption">{v.phone}</div>
          <div className="t-caption" style={{ marginTop: '0.125rem' }}>Role: <span style={{ fontWeight: 600, color: 'var(--emerald)' }}>{(v as { role?: string }).role ?? 'both'}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={v.is_active ? 'pill pill-emerald' : 'pill pill-danger'}>{v.is_active ? 'Active' : 'Inactive'}</span>
                <button onClick={() => toggle(v.id, v.is_active)}
                  style={{ fontSize: '0.8125rem', fontWeight: 600, color: v.is_active ? 'var(--danger)' : 'var(--emerald)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {v.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.75rem' }}>
                <div className="t-label" style={{ marginBottom: '0.125rem' }}>Bank</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>{v.bank_name}</div>
                <div className="t-caption">{v.account_number}</div>
              </div>
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.75rem' }}>
                <div className="t-label" style={{ marginBottom: '0.125rem' }}>Min limit</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emerald)' }}>₦{v.min_limit.toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.75rem' }}>
                <div className="t-label" style={{ marginBottom: '0.125rem' }}>Max limit</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emerald)' }}>₦{v.max_limit.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
        {!vendors.length && <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No vendors yet</div>}
      </div>
    </div>
  )
}