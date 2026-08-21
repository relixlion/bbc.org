'use client'
import { useEffect, useState } from 'react'

export default function DateGreeting() {
  const [greeting, setGreeting] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const now = new Date()
    const h = now.getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    setDateStr(now.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    }).toUpperCase())
  }, [])

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-full)', padding: '0.25rem 0.75rem', marginBottom: '0.875rem' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.05em' }}>{dateStr}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--white)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
        {greeting},<br />
        <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', fontSize: '1.375rem' }}>Member.</span>
      </div>
    </>
  )
}