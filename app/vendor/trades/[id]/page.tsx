'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/format'

interface Message { id: string; sender_role: string; body: string | null; attachment_url: string | null; attachment_type: string | null; created_at: string }
interface Trade { id: string; type: string; status: string; naira_amount: number; usdt_amount: number; created_at: string; vendor: { usdt_address: string }; user: { phone: string; bank_name: string; account_number: string; account_name: string } }

export default function VendorTradePage() {
  const { id } = useParams()
  const router = useRouter()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [sendingProof, setSendingProof] = useState(false)
  const [proofSent, setProofSent] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch(`/api/p2p/trade/${id}`)
    const data = await res.json()
    if (data.trade) {
      setTrade(data.trade)
      setMessages(data.messages)
      // Check if vendor already submitted proof
      const already = data.messages?.some((m: Message) => m.sender_role === 'vendor' && (m.body?.includes('sent') || m.attachment_url))
      if (already && data.trade.status === 'vendor_paid') setProofSent(true)
    }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function markPaidWithProof() {
    if (!proofFile) return
    setSendingProof(true)
    // First send proof message
    const fd = new FormData()
    const isDeposit = trade?.type === 'deposit'
    fd.append('body', isDeposit ? `USDT sent. Transaction proof attached.` : `Bank transfer sent to user. Proof attached.`)
    fd.append('file', proofFile)
    await fetch(`/api/p2p/trade/${id}/message`, { method: 'POST', body: fd })
    // Then mark as paid
    await fetch(`/api/p2p/trade/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vendor_paid' }),
    })
    setProofSent(true)
    setSendingProof(false)
    setActioning(false)
    load()
  }

  async function sendMessage() {
    if (!body && !file) return
    setSending(true)
    const fd = new FormData()
    if (body) fd.append('body', body)
    if (file) fd.append('file', file)
    await fetch(`/api/p2p/trade/${id}/message`, { method: 'POST', body: fd })
    setBody(''); setFile(null); setSending(false); load()
  }

  if (!trade) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-3)', fontSize: '0.875rem' }}>Loading…</div>

  const isDeposit = trade.type === 'deposit'
  const isPending = trade.status === 'pending'

  return (
    <div>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '1.25rem', padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        Back
      </button>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: isDeposit ? 'var(--emerald-2)' : 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
          {isDeposit ? 'Deposit — send USDT' : 'Withdrawal — pay user'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>{formatNaira(trade.naira_amount)}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--ink-3)', marginTop: '0.25rem', textTransform: 'capitalize' }}>Status: {trade.status.replace('_', ' ')}</div>
      </div>

      {/* What vendor needs to do */}
      {isDeposit ? (
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>Send USDT to platform wallet</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{trade.usdt_amount.toFixed(4)} USDT</div>
          <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', wordBreak: 'break-all', fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--ink-2)' }}>
            {trade.vendor?.usdt_address ?? 'Wallet address not configured — contact admin'}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>Transfer to user's account</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>{formatNaira(trade.naira_amount)}</div>
          <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.875rem 1rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{trade.user?.account_number}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ink-3)' }}>{trade.user?.bank_name} · {trade.user?.account_name}</div>
          </div>
        </div>
      )}

      {/* Mark paid with proof */}
      {isPending && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '1.25rem', marginBottom: '1rem' }}>
          {proofSent ? (
            <div className="alert alert-success">
              {isDeposit ? 'USDT sent and proof submitted. Admin will confirm receipt.' : 'Payment sent and proof submitted. Waiting for user confirmation.'}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
                {isDeposit ? 'After sending USDT' : 'After making the bank transfer'}
              </div>
              <div className="t-caption" style={{ marginBottom: '1rem' }}>
                Attach proof of {isDeposit ? 'USDT transaction (TXID screenshot)' : 'bank transfer receipt'} then tap the button.
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: proofFile ? 'var(--emerald-bg)' : 'var(--sand)', borderRadius: 'var(--r-sm)', border: proofFile ? '1.5px solid var(--emerald)' : '1.5px dashed var(--sand-3)', cursor: 'pointer', marginBottom: '0.75rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={proofFile ? 'var(--emerald)' : 'var(--ink-3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: proofFile ? 'var(--emerald)' : 'var(--ink-2)' }}>
                    {proofFile ? proofFile.name : 'Attach proof'}
                  </div>
                  <div className="t-caption">Screenshot or PDF</div>
                </div>
                <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] ?? null)} />
              </label>
              <button onClick={markPaidWithProof} disabled={sendingProof || !proofFile}
                style={{ width: '100%', background: !proofFile ? 'var(--sand-2)' : 'var(--emerald)', color: !proofFile ? 'var(--ink-4)' : 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: !proofFile ? 'default' : 'pointer', opacity: sendingProof ? 0.7 : 1, transition: 'all 0.12s' }}>
                {sendingProof ? 'Submitting…' : !proofFile ? 'Attach proof first' : isDeposit ? '✓ I have sent the USDT' : '✓ I have paid the user'}
              </button>
            </>
          )}
        </div>
      )}

      {trade.status === 'vendor_paid' && (
        <div style={{ background: 'var(--emerald-bg)', border: '1px solid #B7DFD0', borderRadius: 'var(--r-md)', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--emerald-2)' }}>
          {isDeposit ? 'USDT sent — admin will verify receipt and credit user.' : 'Payment marked as sent — waiting for user to confirm receipt.'}
        </div>
      )}

      {trade.status === 'settled' && (
        <div style={{ background: 'var(--emerald-bg)', border: '1px solid #B7DFD0', borderRadius: 'var(--r-md)', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--emerald-2)' }}>
          Trade settled and closed.
        </div>
      )}

      {/* Thread */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--sand-2)', borderRadius: 'var(--r-lg)', padding: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '1rem' }}>Thread</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 280, overflowY: 'auto' }}>
          {messages.length === 0 && <div style={{ fontSize: '0.8125rem', color: 'var(--ink-4)' }}>No messages yet.</div>}
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_role === 'vendor' ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {m.sender_role === 'vendor' ? 'You' : m.sender_role === 'user' ? 'User' : 'Admin'}
              </div>
              <div style={{ background: m.sender_role === 'vendor' ? 'var(--emerald)' : 'var(--sand)', color: m.sender_role === 'vendor' ? 'var(--white)' : 'var(--ink)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.875rem', maxWidth: '80%' }}>
                {m.body && <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{m.body}</div>}
                {m.attachment_url && m.attachment_type === 'image' && <img src={m.attachment_url} alt="" style={{ maxWidth: '100%', borderRadius: 6, marginTop: m.body ? '0.5rem' : 0 }} />}
                {m.attachment_url && m.attachment_type === 'document' && <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: m.sender_role === 'vendor' ? 'rgba(255,255,255,0.8)' : 'var(--emerald)', display: 'block', marginTop: m.body ? '0.5rem' : 0 }}>📄 View document</a>}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ borderTop: '1px solid var(--sand-2)', paddingTop: '1rem' }}>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Send a message…"
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--sand-3)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', minHeight: 64, color: 'var(--ink)', background: 'var(--white)' }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'var(--sand)', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--ink-3)', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              {file ? file.name.slice(0, 16) + '…' : 'Attach'}
              <input type="file" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={sendMessage} disabled={sending || (!body && !file)}
              style={{ padding: '0.5rem 1.25rem', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: (!body && !file) ? 0.5 : 1 }}>
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
