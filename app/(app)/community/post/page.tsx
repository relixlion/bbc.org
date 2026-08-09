'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GreenButton } from '@/components/ui'
import { formatNaira } from '@/lib/format'

interface BlurBox { x: number; y: number; w: number; h: number }

export default function CommunityPostPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [boxes, setBoxes] = useState<BlurBox[]>([])
  const [drawing, setDrawing] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [current, setCurrent] = useState<BlurBox | null>(null)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'pick' | 'edit' | 'confirm'>('pick')

  // Redraw canvas whenever image, boxes, or current box changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const allBoxes = current ? [...boxes, current] : boxes
    allBoxes.forEach(box => {
      // Pixelate: draw region at 1/10 size then scale back up
      const bw = Math.abs(box.w), bh = Math.abs(box.h)
      const bx = box.w < 0 ? box.x + box.w : box.x
      const by = box.h < 0 ? box.y + box.h : box.y
      if (bw < 4 || bh < 4) return
      const tmp = document.createElement('canvas')
      tmp.width = Math.max(1, Math.round(bw / 10))
      tmp.height = Math.max(1, Math.round(bh / 10))
      const tc = tmp.getContext('2d')!
      tc.drawImage(canvas, bx, by, bw, bh, 0, 0, tmp.width, tmp.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, bx, by, bw, bh)
      ctx.imageSmoothingEnabled = true
      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, by, bw, bh)
    })
  }, [image, boxes, current])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please pick an image file'); return }
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setBoxes([])
      setCurrent(null)
      setStep('edit')
    }
    img.src = URL.createObjectURL(file)
  }

  function getPos(e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  function onDown(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const pos = getPos(e, canvas)
    setStart(pos); setDrawing(true); setCurrent({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }

  function onMove(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const pos = getPos(e, canvas)
    setCurrent({ x: start.x, y: start.y, w: pos.x - start.x, h: pos.y - start.y })
  }

  function onUp(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    if (!drawing || !current) return
    const bw = Math.abs(current.w), bh = Math.abs(current.h)
    if (bw > 4 && bh > 4) setBoxes(b => [...b, current])
    setDrawing(false); setCurrent(null)
  }

  function undoLast() { setBoxes(b => b.slice(0, -1)) }

  async function submit() {
    if (!image || !amount) { setError('Add an image and enter the amount'); return }
    setSubmitting(true); setError('')

    // Export canvas as blob
    const canvas = canvasRef.current!
    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.88))

    // Upload to Supabase Storage via API
    const fd = new FormData()
    fd.append('file', blob, `post-${Date.now()}.jpg`)
    fd.append('amount', amount)

    const res = await fetch('/api/community/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    router.push('/community')
  }

  // Canvas dimensions — fit to image aspect ratio, max width 380px
  const CANVAS_W = 380
  const canvasH = image ? Math.round(CANVAS_W * (image.naturalHeight / image.naturalWidth)) : 280

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <button onClick={() => step === 'edit' ? setStep('pick') : router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.75rem', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Share your withdrawal</div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Show the community your earnings</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div className="alert alert-error">{error}</div>}

        {step === 'pick' && (
          <>
            <div className="alert alert-warn" style={{ margin: 0 }}>
              Before uploading, blur any sensitive details (account number, name) in your screenshot using your phone's photo editor or any app. You can also use the blur tool on the next screen.
            </div>
            <label style={{ display: 'block', border: '2px dashed var(--sand-3)', borderRadius: 'var(--r-lg)', padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: 'var(--white)', transition: 'border-color 0.12s' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 0.75rem' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
              </svg>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>Tap to select image</div>
              <div className="t-caption">Your withdrawal screenshot</div>
            </label>
          </>
        )}

        {step === 'edit' && image && (
          <>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div className="t-subhead" style={{ marginBottom: '0.125rem' }}>Blur sensitive areas</div>
                  <div className="t-caption">Draw over account numbers or names to pixelate them</div>
                </div>
                <button onClick={undoLast} disabled={boxes.length === 0}
                  style={{ fontSize: '0.8125rem', fontWeight: 600, color: boxes.length === 0 ? 'var(--ink-4)' : 'var(--emerald)', background: 'none', border: 'none', cursor: boxes.length === 0 ? 'default' : 'pointer' }}>
                  Undo
                </button>
              </div>
              <canvas ref={canvasRef} width={CANVAS_W} height={canvasH}
                style={{ width: '100%', borderRadius: 'var(--r-sm)', touchAction: 'none', display: 'block', cursor: 'crosshair', userSelect: 'none' }}
                onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
                onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
              />
              <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem' }}>
                <span className="pill pill-neutral">{boxes.length} blur box{boxes.length !== 1 ? 'es' : ''} drawn</span>
                {boxes.length > 0 && <span className="pill pill-emerald">Areas pixelated</span>}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <div className="t-subhead" style={{ marginBottom: '0.75rem' }}>Withdrawal amount</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--ink-3)', pointerEvents: 'none' }}>₦</span>
                <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', fontFamily: 'var(--font-display)', fontSize: '1.375rem', letterSpacing: '-0.02em', color: 'var(--ink)', background: 'var(--sand)', border: '1.5px solid var(--sand-3)', borderRadius: 'var(--r-sm)', outline: 'none' }} />
              </div>
            </div>

            <GreenButton onClick={submit} disabled={submitting || !amount}>
              {submitting ? 'Posting…' : 'Post to community'}
            </GreenButton>
          </>
        )}
      </div>
    </div>
  )
}
