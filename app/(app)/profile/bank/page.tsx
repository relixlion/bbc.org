'use client'
import { useEffect, useState } from 'react'
import { GreenButton, Input, Select } from '@/components/ui'

export default function BankPage() {
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([])
  const [saved, setSaved] = useState<{ bank_name: string; account_number: string; account_name: string }|null>(null)
  const [form, setForm] = useState({ bank_name: '', bank_code: '', account_number: '' })
  const [verifiedName, setVerifiedName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/paystack/banks').then(r => r.json()).then(d => Array.isArray(d) && setBanks(d))
    fetch('/api/bank').then(r => r.json()).then(d => { if (d?.bank_name) setSaved(d) })
  }, [])

  async function save() {
    setError(''); setSaving(true)
    const res = await fetch('/api/bank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) setError(data.error)
    else { setSuccess('Bank account saved'); setSaved({ bank_name: form.bank_name, account_number: form.account_number, account_name: data.account_name }); setVerifiedName(data.account_name) }
    setSaving(false)
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Bank account</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Used for all withdrawals</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {saved && (
          <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.25rem' }}>
            <div className="t-label" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem' }}>{saved.bank_name}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--white)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{saved.account_number}</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{saved.account_name}</div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <div className="t-subhead" style={{ marginBottom: '1rem' }}>{saved ? 'Update account' : 'Add bank account'}</div>
          <Select label="Bank" value={form.bank_code} onChange={e => { const b = banks.find(x => x.code === e.target.value); setForm(f => ({ ...f, bank_code: e.target.value, bank_name: b?.name ?? '' })) }}>
            <option value="">Select your bank</option>
            {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </Select>
          <Input label="Account number" type="tel" maxLength={10} placeholder="10-digit number" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
          {verifiedName && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{verifiedName}</div>}
          <GreenButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save account'}</GreenButton>
        </div>
      </div>
    </div>
  )
}
