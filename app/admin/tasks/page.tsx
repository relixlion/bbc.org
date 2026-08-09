'use client'
import { useEffect, useState } from 'react'
import { Task } from '@/types'
import { GreenButton, Input } from '@/components/ui'

const TYPE_LABELS: Record<string, string> = {
  daily_reward: 'Daily reward task',
  weekly_salary: 'Weekly salary task',
  checkin: 'Check-in task',
}

const TYPE_DESC: Record<string, string> = {
  daily_reward: 'Required before users claim their daily plan returns',
  weekly_salary: 'Required before users claim their weekly salary',
  checkin: 'Optional gate on the daily check-in reward',
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editing, setEditing] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/admin/tasks').then(r => r.json()).then(d => Array.isArray(d) && setTasks(d))
  useEffect(() => { load() }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    await fetch('/api/admin/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    setSaving(false); setEditing(null); load()
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Tasks</div>
        <div className="t-caption">Tasks gate reward claims — users complete the task before they can claim</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tasks.map((t) => (
          <div key={t.id} className="card" style={{ padding: '1.25rem' }}>
            {editing?.id === t.id ? (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{TYPE_LABELS[t.type]}</div>
                  <div className="t-caption">{TYPE_DESC[t.type]}</div>
                </div>
                <Input label="Task title shown to user" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                <Input label="Link (YouTube, Instagram, Telegram, etc.)" value={editing.link ?? ''} onChange={e => setEditing({ ...editing, link: e.target.value })} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', padding: '0.875rem 1rem', background: 'var(--sand)', borderRadius: 'var(--r-sm)' }}>
                  <input type="checkbox" id={`active-${t.id}`} checked={editing.is_active}
                    onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--emerald)', cursor: 'pointer' }} />
                  <label htmlFor={`active-${t.id}`} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
                    Task active — users must complete before claiming
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                  <GreenButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save task'}</GreenButton>
                  <button onClick={() => setEditing(null)} style={{ padding: '0 1.25rem', borderRadius: 'var(--r-md)', border: '1.5px solid var(--sand-3)', background: 'none', fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{TYPE_LABELS[t.type]}</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem' }}>{t.title}</div>
                    {t.link && <div className="t-caption" style={{ wordBreak: 'break-all' }}>{t.link}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                    <span className={t.is_active ? 'pill pill-emerald' : 'pill pill-neutral'}>{t.is_active ? 'Active' : 'Off'}</span>
                    <button onClick={() => setEditing(t)} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emerald)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  </div>
                </div>
                <div className="t-caption">{TYPE_DESC[t.type]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
