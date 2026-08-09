'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatNaira } from '@/lib/format'

interface Message { id: string; sender_role: string; body: string | null; attachment_url: string | null; attachment_type: string | null; created_at: string }
interface Trade { id: string; type: string; status: string; naira_amount: number; created_at: string; auto_settle_at: string; vendor: { name: string; bank_name: string; account_number: string; account_name: string } }

const STATUS_PILL: Record<string, string> = {
  pending: 'pill pill-amber', vendor_paid: 'pill pill-emerald',
  confirmed: 'pill pill-emerald', settled: 'pill pill-neutral',
  disputed: 'pill pill-danger', cancelled: 'pill pill-danger',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', vendor_paid: 'Payment sent by vendor',
  confirmed: 'Confirmed', settled: 'Settled',
  disputed: 'Disputed', cancelled: 'Cancelled',
}

export default function TradePage() {
  const { id } = useParams()
  const router = useRouter()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [transferSent, setTransferSent] = useState(false)
  const [transferFile, setTransferFile] = useState<File | null>(null)
  const [sendingTransfer, setSendingTransfer] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch(`/api/p2p/trade/${id}`)
    const data = await res.json()
    if (data.trade) {
      setTrade(data.trade)
      setMessages(data.messages)
      // If there's already a user message saying they transferred, mark button as sent
      const alreadySent = data.messages?.some((m: Message) => m.sender_role === 'user' && m.body?.includes('have made the transfer'))
      if (alreadySent) setTransferSent(true)
    }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!body && !file) return
    setSending(true)
    const fd = new FormData()
    if (body) fd.append('body', body)
    if (file) fd.append('file', file)
    await fetch(`/api/p2p/trade/${id}/message`, { method: 'POST', body: fd })
    setBody(''); setFile(null); setSending(false); load()
  }

  async function action(act: string) {
    setActioning(true)
    await fetch(`/api/p2p/trade/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act }),
    })
    setActioning(false); load()
  }

  async function markTransferSent() {
    if (!transferFile) return
    setSendingTransfer(true)
    const fd = new FormData()
    fd.append('body', `I have made the transfer of ${formatNaira(trade!.naira_amount)}. Receipt attached.`)
    fd.append('file', transferFile)
    await fetch(`/api/p2p/trade/${id}/message`, { method: 'POST', body: fd })
    setTransferSent(true)
    setSendingTransfer(false)
    load()
  }

  if (!trade) return <div className="spinner" style={{ marginTop: '3rem' }} />

  const autoSettleDate = new Date(trade.auto_settle_at)
  const hoursLeft = Math.max(0, Math.round((autoSettleDate.getTime() - Date.now()) / 3600000))
  const canDispute = ['pending', 'vendor_paid'].includes(trade.status) && hoursLeft > 0
  const vendor = trade.vendor

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.75rem', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {trade.type === 'deposit' ? 'Deposit' : 'Withdrawal'} · {formatNaira(trade.naira_amount)}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Vendor: {vendor?.name}</div>
          </div>
          <span className={STATUS_PILL[trade.status] ?? 'pill pill-neutral'}>{STATUS_LABEL[trade.status]}</span>
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* DEPOSIT — show bank account and transfer button */}
        {trade.type === 'deposit' && trade.status === 'pending' && (
          <div className="card" style={{ padding: '1.25rem', border: '1.5px solid var(--emerald)' }}>
            <div className="t-subhead" style={{ marginBottom: '0.375rem' }}>Transfer to this account</div>
            <div className="t-caption" style={{ marginBottom: '1rem' }}>Send the exact amount. Once done, attach your receipt and tap the button below.</div>
            <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-md)', padding: '1.25rem', color: 'var(--white)', marginBottom: '0.875rem' }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{vendor?.bank_name}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', color: 'var(--white)', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{vendor?.account_number}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{vendor?.account_name}</div>
            </div>
            <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="t-caption">Amount to transfer</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{formatNaira(trade.naira_amount)}</div>
            </div>

            {transferSent ? (
              <div className="alert alert-success">
                Transfer confirmed — receipt sent. Waiting for admin to verify and credit your wallet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div className="t-label" style={{ marginBottom: '0.5rem' }}>Attach transfer receipt (required)</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: transferFile ? 'var(--emerald-bg)' : 'var(--sand)', borderRadius: 'var(--r-sm)', border: transferFile ? '1.5px solid var(--emerald)' : '1.5px dashed var(--sand-3)', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={transferFile ? 'var(--emerald)' : 'var(--ink-3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: transferFile ? 'var(--emerald)' : 'var(--ink-2)' }}>
                        {transferFile ? transferFile.name : 'Tap to attach receipt'}
                      </div>
                      <div className="t-caption">Screenshot or PDF of your bank transfer</div>
                    </div>
                    <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={e => setTransferFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <button onClick={markTransferSent} disabled={sendingTransfer || !transferFile}
                  style={{ width: '100%', background: !transferFile ? 'var(--sand-2)' : 'var(--emerald)', color: !transferFile ? 'var(--ink-4)' : 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.9375rem', fontWeight: 700, cursor: !transferFile ? 'default' : 'pointer', opacity: sendingTransfer ? 0.7 : 1, transition: 'all 0.12s' }}>
                  {sendingTransfer ? 'Sending…' : !transferFile ? 'Attach receipt first' : '✓ I have made the transfer'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* WITHDRAWAL — vendor has paid, user must confirm */}
        {trade.type === 'withdrawal' && trade.status === 'vendor_paid' && (
          <div className="card" style={{ padding: '1.25rem', border: '1.5px solid var(--emerald)' }}>
            <div className="t-subhead" style={{ marginBottom: '0.375rem' }}>Vendor has sent your payment</div>
            <div className="t-caption" style={{ marginBottom: '1rem' }}>Check your bank account. Confirm once you have received the money.</div>
            <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="t-caption">Auto-settles in</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: hoursLeft < 6 ? 'var(--danger)' : 'var(--ink)', letterSpacing: '-0.02em' }}>{hoursLeft}h remaining</span>
            </div>
            <button onClick={() => action('confirm_received')} disabled={actioning}
              style={{ width: '100%', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
              {actioning ? 'Confirming…' : '✓ I have received the payment'}
            </button>
          </div>
        )}

        {trade.status === 'settled' && <div className="alert alert-success">This trade is settled and closed.</div>}
        {trade.status === 'disputed' && <div className="alert alert-error">Dispute open — admin will review and resolve.</div>}

        {canDispute && trade.status !== 'disputed' && (
          <button onClick={() => action('dispute')} disabled={actioning}
            style={{ width: '100%', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #F5C6C2', borderRadius: 'var(--r-md)', padding: '0.75rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>
            Open dispute · {hoursLeft}h remaining
          </button>
        )}

        {/* Thread */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="t-subhead" style={{ marginBottom: '1rem' }}>Thread</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 320, overflowY: 'auto' }}>
            {messages.length === 0 && <div className="t-caption">No messages yet.</div>}
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  {m.sender_role === 'user' ? 'You' : m.sender_role === 'vendor' ? 'Vendor' : 'Admin'}
                </div>
                <div style={{ background: m.sender_role === 'user' ? 'var(--emerald)' : 'var(--sand)', color: m.sender_role === 'user' ? 'var(--white)' : 'var(--ink)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.875rem', maxWidth: '80%' }}>
                  {m.body && <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{m.body}</div>}
                  {m.attachment_url && m.attachment_type === 'image' && <img src={m.attachment_url} alt="" style={{ maxWidth: '100%', borderRadius: 6, marginTop: m.body ? '0.5rem' : 0 }} />}
                  {m.attachment_url && m.attachment_type === 'document' && <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: m.sender_role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--emerald)', display: 'block', marginTop: m.body ? '0.5rem' : 0 }}>📄 View document</a>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {['pending', 'vendor_paid', 'disputed'].includes(trade.status) && (
            <div style={{ borderTop: '1px solid var(--sand-2)', paddingTop: '1rem' }}>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Send a message…"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--sand-3)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', minHeight: 72, color: 'var(--ink)', background: 'var(--white)' }} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
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
          )}
        </div>
      </div>
    </div>
  )
}
