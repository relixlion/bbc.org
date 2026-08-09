'use client'
import { useRouter } from 'next/navigation'
export default function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }
  return (
    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem', background: 'var(--white)', border: '1px solid #F5C6C2', borderRadius: 'var(--r-md)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </div>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--danger)' }}>Sign out</span>
    </button>
  )
}
