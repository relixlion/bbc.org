'use client'
import { useEffect, useState } from 'react'
import { Reward, Task } from '@/types'
import { formatNaira } from '@/lib/format'
import { Spinner } from '@/components/ui'

const TYPE_LABELS: Record<string, string> = { daily: 'Daily return', fixed: 'Fixed return', referral: 'Referral commission', checkin: 'Check-in', salary: 'Weekly salary', admin_gift: 'Bonus gift' }

export default function RewardsPage() {
  const [tab, setTab] = useState<'pending'|'claimed'>('pending')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [tasks, setTasks] = useState<Record<string, Task>>({})
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string|null>(null)
  const [completing, setCompleting] = useState<string|null>(null)

  async function load() {
    setLoading(true)
    const [rRes, tRes] = await Promise.all([fetch(`/api/rewards?status=${tab}`), fetch('/api/admin/tasks')])
    const [r, t] = await Promise.all([rRes.json(), tRes.json()])
    setRewards(Array.isArray(r) ? r : [])
    const tMap: Record<string, Task> = {}
    if (Array.isArray(t)) t.forEach((task: Task) => { tMap[task.type] = task })
    setTasks(tMap)
    setLoading(false)
  }
  useEffect(() => { load() }, [tab])

  async function completeTask(id: string) {
    setCompleting(id)
    await fetch('/api/rewards/complete-task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reward_id: id }) })
    setCompleting(null); load()
  }
  async function claim(id: string) {
    setClaiming(id)
    await fetch('/api/rewards/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reward_id: id }) })
    setClaiming(null); load()
  }

  const pendingTotal = rewards.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Rewards</div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-md)', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pending</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>{formatNaira(pendingTotal)}</div>
          </div>
        </div>
      </div>

      <div className="tab-row">
        {(['pending','claimed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'active' : ''}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {loading ? <Spinner /> : rewards.length === 0 ? (
          <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No {tab} rewards</div>
        ) : rewards.map((r) => {
          const taskKey = r.type === 'daily' ? 'daily_reward' : r.type === 'salary' ? 'weekly_salary' : 'checkin'
          const task = tasks[taskKey]
          const canClaim = !r.task_required || r.task_completed
          return (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <div className="t-label" style={{ marginBottom: '0.25rem' }}>{TYPE_LABELS[r.type]}</div>
                  <div className="t-body" style={{ fontWeight: 600 }}>{r.label}</div>

                  {r.task_required && !r.task_completed && task && (
                    <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-dim)', borderRadius: 'var(--r-sm)', padding: '0.75rem', marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A5500', marginBottom: '0.375rem' }}>Complete task to claim</div>
                      <div className="t-caption" style={{ marginBottom: '0.5rem' }}>{task.title}</div>
                      {task.link && <a href={task.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', display: 'block', marginBottom: '0.5rem' }}>Open link →</a>}
                      <button onClick={() => completeTask(r.id)} disabled={completing === r.id}
                        style={{ width: '100%', background: 'var(--amber)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-sm)', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        {completing === r.id ? 'Marking…' : "Done — mark as complete"}
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--emerald)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{formatNaira(r.amount)}</div>
                  {tab === 'pending' && (
                    <button onClick={() => canClaim && claim(r.id)} disabled={!canClaim || claiming === r.id}
                      style={{ background: canClaim ? 'var(--emerald)' : 'var(--sand-2)', color: canClaim ? 'var(--white)' : 'var(--ink-4)', border: 'none', borderRadius: 'var(--r-sm)', padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 700, cursor: canClaim ? 'pointer' : 'default' }}>
                      {claiming === r.id ? '…' : canClaim ? 'Claim' : 'Task first'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
