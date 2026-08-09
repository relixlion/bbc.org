'use client'
import { useEffect, useState } from 'react'
import { formatNaira, maskPhone } from '@/lib/format'

interface Post { id: string; user_id: string; image_url: string | null; amount_shown: number | null; status: string; created_at: string; user?: { phone: string } }

export default function AdminCommunity() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const load = () => {
    fetch('/api/community').then(r => r.json()).then(d => {
      if (Array.isArray(d)) { setPosts(d); setLoading(false) }
    })
  }
  useEffect(() => { load() }, [])

  async function toggle(id: string, status: string) {
    setProcessing(id)
    await fetch('/api/admin/community', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: status === 'visible' ? 'hidden' : 'visible' }) })
    setProcessing(null); load()
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Community</div>
        <div className="t-caption">{posts.length} post{posts.length !== 1 ? 's' : ''} · moderate withdrawal proofs</div>
      </div>

      {loading ? (
        <div className="t-caption" style={{ textAlign: 'center', padding: '3rem' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {posts.map((p) => (
            <div key={p.id} className="card" style={{ padding: '1.125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{maskPhone(p.user?.phone ?? '')}</div>
                  <div className="t-caption">{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button onClick={() => toggle(p.id, p.status)} disabled={processing === p.id}
                  style={{ padding: '0.375rem 0.875rem', borderRadius: 'var(--r-full)', fontSize: '0.8125rem', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: processing === p.id ? 0.6 : 1, background: p.status === 'visible' ? 'var(--danger-bg)' : 'var(--emerald-bg)', color: p.status === 'visible' ? 'var(--danger)' : 'var(--emerald-2)', transition: 'all 0.12s' }}>
                  {processing === p.id ? '…' : p.status === 'visible' ? 'Hide post' : 'Show post'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1.25rem', flex: 1 }}>
                  <div className="t-label" style={{ color: 'var(--emerald-2)', marginBottom: '0.25rem' }}>Amount shown</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(p.amount_shown ?? 0)}</div>
                </div>
                <span className={p.status === 'visible' ? 'pill pill-emerald' : 'pill pill-danger'}>{p.status === 'visible' ? 'Visible' : 'Hidden'}</span>
              </div>

              {p.image_url && (
                <img src={p.image_url} alt="withdrawal proof" style={{ marginTop: '0.75rem', width: '100%', borderRadius: 'var(--r-sm)', maxHeight: 160, objectFit: 'cover' }} />
              )}
            </div>
          ))}
          {!posts.length && <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No community posts yet</div>}
        </div>
      )}
    </div>
  )
}
