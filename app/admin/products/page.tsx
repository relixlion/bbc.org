'use client'
import { useEffect, useState } from 'react'
import { Plan } from '@/types'
import { GreenButton, Input, Select } from '@/components/ui'
import { formatNaira } from '@/lib/format'

const EMPTY = { name: '', category: 'bigbrother', plan_type: 'daily', price: '', daily_return: '', fixed_return_percent: '', duration_days: '', weekly_salary: '', is_active: true }
const CAT_LABEL: Record<string, string> = { bigbrother: 'Big Brother', football: 'Football', forest: 'Forest' }
const CAT_COLOR: Record<string, string> = { bigbrother: 'var(--emerald)', football: '#92400E', forest: '#166534' }

export default function AdminProducts() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [form, setForm] = useState<Record<string, unknown>>({ ...EMPTY })
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = () => fetch('/api/admin/plans').then(r => r.json()).then(d => Array.isArray(d) && setPlans(d))
  useEffect(() => { load() }, [])

  function setF(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function save() {
    setSaving(true)
    const payload = { ...form, price: Number(form.price), daily_return: form.plan_type === 'daily' ? Number(form.daily_return) : null, fixed_return_percent: form.plan_type === 'fixed' ? Number(form.fixed_return_percent) : null, duration_days: Number(form.duration_days), weekly_salary: Number(form.weekly_salary ?? 0) }
    if (editing) await fetch('/api/admin/plans', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing, ...payload }) })
    else await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setForm({ ...EMPTY }); setEditing(null); setSaving(false); setShowForm(false); load()
  }

  async function del(id: string) {
    if (!confirm('Delete this plan?')) return
    await fetch('/api/admin/plans', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  function edit(p: Plan) {
    setEditing(p.id)
    setForm({ name: p.name, category: p.category, plan_type: p.plan_type, price: String(p.price), daily_return: String(p.daily_return ?? ''), fixed_return_percent: String(p.fixed_return_percent ?? ''), duration_days: String(p.duration_days), weekly_salary: String((p as unknown as Record<string,unknown>).weekly_salary ?? ''), is_active: p.is_active })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() { setEditing(null); setForm({ ...EMPTY }); setShowForm(false) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Plans</div>
          <div className="t-caption">{plans.length} active plan{plans.length !== 1 ? 's' : ''}</div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ width: 'auto', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
            + New plan
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1.5px solid var(--emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div className="t-subhead">{editing ? 'Edit plan' : 'Create new plan'}</div>
            <button onClick={cancel} style={{ fontSize: '0.8125rem', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Plan name" placeholder="e.g. Big Brother Alpha" value={String(form.name)} onChange={setF('name')} />
            </div>
            <Select label="Category" value={String(form.category)} onChange={setF('category')}>
              <option value="bigbrother">Big Brother</option>
              <option value="football">Football</option>
              <option value="forest">Forest</option>
            </Select>
            <Select label="Plan type" value={String(form.plan_type)} onChange={setF('plan_type')}>
              <option value="daily">Daily income</option>
              <option value="fixed">Fixed term</option>
            </Select>
            <Input label="Price (₦)" type="number" placeholder="0" value={String(form.price)} onChange={setF('price')} />
            <Input label="Duration (days)" type="number" placeholder="0" value={String(form.duration_days)} onChange={setF('duration_days')} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Weekly salary (₦) — paid per plan per week to user" type="number" placeholder="0" value={String(form.weekly_salary ?? '')} onChange={setF('weekly_salary')} />
            </div>
            {form.plan_type === 'daily' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Daily return (₦)" type="number" placeholder="0" value={String(form.daily_return)} onChange={setF('daily_return')} />
              </div>
            )}
            {form.plan_type === 'fixed' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Fixed return (%)" type="number" placeholder="0" value={String(form.fixed_return_percent)} onChange={setF('fixed_return_percent')} />
              </div>
            )}
          </div>
          <GreenButton onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update plan' : 'Create plan'}</GreenButton>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {plans.map((p) => (
          <div key={p.id} className="card" style={{ padding: '1.125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: CAT_COLOR[p.category] ?? 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white)' }}>{p.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      <span className="pill pill-neutral">{CAT_LABEL[p.category]}</span>
                      <span className="pill pill-neutral">{formatNaira(p.price)}</span>
                      <span className="pill pill-neutral">{p.duration_days}d</span>
                      {p.plan_type === 'daily' && <span className="pill pill-emerald">{formatNaira(p.daily_return ?? 0)}/day</span>}
                      {p.plan_type === 'fixed' && <span className="pill pill-amber">{p.fixed_return_percent}% return</span>}
                      {!p.is_active && <span className="pill pill-danger">Inactive</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                    <button onClick={() => edit(p)} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emerald)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => del(p.id)} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!plans.length && <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No plans yet. Create your first plan above.</div>}
      </div>
    </div>
  )
}
