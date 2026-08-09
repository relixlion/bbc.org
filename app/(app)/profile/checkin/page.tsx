'use client'
import { useEffect, useState } from 'react'
import { GreenButton } from '@/components/ui'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CheckinPage() {
  const [status, setStatus] = useState<{ checked_in_today: boolean; week_logs: string[] }|null>(null)
  const [task, setTask] = useState<{ title: string; link: string|null; is_active: boolean }|null>(null)
  const [taskDone, setTaskDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [checkinAmount, setCheckinAmount] = useState<number>(80)

  useEffect(() => {
    fetch('/api/checkin').then(r => r.json()).then(setStatus)
    fetch('/api/admin/tasks').then(r => r.json()).then((ts) => {
      if (Array.isArray(ts)) {
        const t = ts.find((x: { type: string; is_active: boolean }) => x.type === 'checkin' && x.is_active)
        if (t) setTask(t)
      }
    })
    fetch('/api/admin/settings').then(r => r.json()).then((s) => {
      if (s?.checkin_amount) setCheckinAmount(Number(s.checkin_amount))
    })
  }, [])

  async function checkin() {
    setLoading(true)
    const res = await fetch('/api/checkin', { method: 'POST' })
    const data = await res.json()
    if (res.ok) { setSuccess(`₦${data.amount} added to your rewards`); setStatus(s => s ? { ...s, checked_in_today: true } : s) }
    setLoading(false)
  }

  const today = new Date()
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay())

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Daily check-in</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Check in every day to earn rewards</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--emerald)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>₦{checkinAmount.toLocaleString()}</div>
          <div className="t-caption" style={{ marginBottom: '1.5rem' }}>Today's check-in reward</div>

          {task && !taskDone && !status?.checked_in_today && (
            <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-dim)', borderRadius: 'var(--r-sm)', padding: '1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A5500', marginBottom: '0.375rem' }}>Today's task</div>
              <div className="t-body" style={{ marginBottom: '0.625rem' }}>{task.title}</div>
              {task.link && <a href={task.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emerald)', display: 'block', marginBottom: '0.75rem' }}>Open link →</a>}
              <button onClick={() => setTaskDone(true)} style={{ width: '100%', background: 'var(--amber)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-sm)', padding: '0.625rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>
                Done — I've completed the task
              </button>
            </div>
          )}

          {status?.checked_in_today
            ? <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-sm)', padding: '0.875rem', color: 'var(--emerald-2)', fontWeight: 600, fontSize: '0.875rem' }}>✓ Checked in today</div>
            : <GreenButton onClick={checkin} disabled={loading || (!!task && !taskDone)}>{loading ? 'Checking in…' : `Claim ₦${checkinAmount.toLocaleString()}`}</GreenButton>
          }
        </div>

        <div className="card">
          <div className="t-subhead" style={{ marginBottom: '1rem' }}>This week</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {DAYS.map((d, i) => {
              const day = new Date(weekStart); day.setDate(weekStart.getDate() + i)
              const dayStr = day.toISOString().split('T')[0]
              const done = status?.week_logs.includes(dayStr)
              const isToday = day.toDateString() === today.toDateString()
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'var(--emerald)' : isToday ? 'var(--emerald-bg)' : 'var(--sand-2)', border: isToday && !done ? '2px solid var(--emerald)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: done ? 'var(--white)' : isToday ? 'var(--emerald)' : 'var(--ink-4)' }}>{d.slice(0,1)}</span>
                  </div>
                  <div style={{ fontSize: '0.625rem', fontWeight: 600, color: done ? 'var(--emerald)' : 'var(--ink-4)', marginTop: '0.25rem' }}>{done ? '✓' : '·'}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
