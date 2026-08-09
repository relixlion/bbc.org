'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCommunityToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const newStatus = current === 'visible' ? 'hidden' : 'visible'
    await fetch('/api/admin/community', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    setCurrent(newStatus)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading}
      style={{ padding: '0.625rem 1.25rem', borderRadius: 'var(--r-md)', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1, background: current === 'visible' ? 'var(--danger-bg)' : 'var(--emerald-bg)', color: current === 'visible' ? 'var(--danger)' : 'var(--emerald-2)', transition: 'all 0.12s' }}>
      {loading ? '…' : current === 'visible' ? 'Hide post' : 'Make visible'}
    </button>
  )
}