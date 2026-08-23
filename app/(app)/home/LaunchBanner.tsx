'use client'
import { useEffect, useState } from 'react'

export default function LaunchBanner() {
  const LAUNCH = new Date('2026-08-24T11:00:00Z')
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number; launched: boolean } | null>(null)

  useEffect(() => {
    function tick() {
      const diff = LAUNCH.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ h: 0, m: 0, s: 0, launched: true }); return }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        launched: false,
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  if (!timeLeft) return null
  if (timeLeft.launched) return null

  return (
    <div style={{ background: 'var(--amber)', padding: '0.625rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(0,0,0,0.65)' }}>
        🚀 Official launch
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--white)', letterSpacing: '-0.01em' }}>
        {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
      </div>
      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
        Mon 24 Aug · noon
      </div>
    </div>
  )
}