'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatNaira, maskPhone } from '@/lib/format'

interface Message { id: string; sender_role: string; body: string | null; attachment_url: string | null; attachment_type: string | null; created_at: string }
interface Trade { id: string; type: string; status: string; naira_amount: number; usdt_amount: number; rate: number; txid: string | null; created_at: string; auto_settle_at: string; vendor: { name: string; usdt_address: string; bank_name: string; account_number: string; account_name: string }; user: { phone: string; bank_name: string; account_number: string; account_name: string } }

export default function AdminTradePage() {
  const { id } = useParams()
  const router = useRouter()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [settling, setSettling] = useState(false)
  const [markingReceived, setMarkingReceived] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch(`/api/p2p/trade/${id}`)
    const data = await res.json()
    if (data.trade) { setTrade(data.trade); setMessages(data.messages) }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function settle(resolution: string) {
    setSettling(true)
    await fetch('/api/admin/p2p/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade_id: id, resolution }),
    })
    setSettling(false); load()
  }

  async function markDepositReceived() {
    setMarkingReceived(true)
    await fetch(`/api/admin/p2p/deposit-received`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trade_id: id }),
    })
    setMarkingReceived(false); load()
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
  const isDisputed = trade.status === 'disputed'
  const isOpen = !['settled', 'cancelled'].includes(trade.status)

  return (
    <div>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '1.25rem', padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        Back to trades
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: isDeposit ? 'var(--emerald-2)' : 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>{isDeposit ? 'Deposit' : 'Withdrawal'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.25rem' }}>{formatNaira(trade.naira_amount)}</div>
          <div className="t-caption">{trade.usdt_amount.toFixed(4)} USDT · rate ₦{trade.rate.toLocaleString()}/$</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDisputed ? 'var(--danger)' : 'var(--ink-3)', marginBottom: '0.25rem' }}>{trade.status.replace('_', ' ').toUpperCase()}</div>
          <div className="t-caption">{new Date(trade.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="t-label" style={{ marginBottom: '0.5rem' }}>User</div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{maskPhone(trade.user?.phone ?? '')}</div>
          <div className="t-caption">{trade.user?.bank_name}</div>
          <div className="t-caption">{trade.user?.account_number} · {trade.user?.account_name}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="t-label" style={{ marginBottom: '0.5rem' }}>Vendor</div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{trade.vendor?.name}</div>
          <div className="t-caption">{trade.vendor?.bank_name}</div>
          <div className="t-caption">{trade.vendor?.account_number} · {trade.vendor?.account_name}</div>
        </div>
      </div>

      {isDeposit && isOpen && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', border: '1.5px solid var(--emerald)' }}>
          <div className="t-subhead" style={{ marginBottom: '0.375rem' }}>Confirm USDT received</div>
          <div className="t-caption" style={{ marginBottom: '1rem' }}>Once you confirm USDT has arrived in your wallet, the user's naira balance will be credited.</div>
          <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', wordBreak: 'break-all' }}>
            <div className="t-label" style={{ marginBottom: '0.25rem' }}>Your wallet address</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--ink-2)' }}>{trade.vendor?.usdt_address ?? 'Not set'}</div>
          </div>
          <button onClick={markDepositReceived} disabled={markingReceived}
            style={{ width: '100%', background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: markingReceived ? 0.7 : 1 }}>
            {markingReceived ? 'Confirming…' : 'USDT received — credit user wallet'}
          </button>
        </div>
      )}

      {isDisputed && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', border: '1.5px solid var(--danger)' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.375rem' }}>Dispute — admin action required</div>
          <div className="t-caption" style={{ marginBottom: '1rem' }}>Review the thread below and force-settle this trade.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button onClick={() => settle('credit_user')} disabled={settling}
              style={{ background: 'var(--emerald)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-md)', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: settling ? 0.7 : 1 }}>
              {settling ? '…' : 'Settle — credit user'}
            </button>
            <button onClick={() => settle('release_to_vendor')} disabled={settling}
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #F5C6C2', borderRadius: 'var(--r-md)', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: settling ? 0.7 : 1 }}>
              {settling ? '…' : 'Settle — release to vendor'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="t-subhead" style={{ marginBottom: '1rem' }}>Thread</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 360, overflowY: 'auto' }}>
          {messages.length === 0 && <div className="t-caption">No messages yet.</div>}
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_role === 'admin' ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {m.sender_role === 'admin' ? 'You (Admin)' : m.sender_role === 'vendor' ? 'Vendor' : 'User'}
              </div>
              <div style={{ background: m.sender_role === 'admin' ? 'var(--ink)' : 'var(--sand)', color: m.sender_role === 'admin' ? 'var(--white)' : 'var(--ink)', borderRadius: 'var(--r-sm)', padding: '0.625rem 0.875rem', maxWidth: '80%' }}>
                {m.body && <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{m.body}</div>}
                {m.attachment_url && m.attachment_type === 'image' && <img src={m.attachment_url} alt="" style={{ maxWidth: '100%', borderRadius: 6, marginTop: m.body ? '0.5rem' : 0 }} />}
                {m.attachment_url && m.attachment_type === 'document' && <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: m.sender_role === 'admin' ? 'rgba(255,255,255,0.8)' : 'var(--emerald)', display: 'block', marginTop: m.body ? '0.5rem' : 0 }}>📄 View document</a>}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {isOpen && (
          <div style={{ borderTop: '1px solid var(--sand-2)', paddingTop: '1rem' }}>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Send a message to user and vendor…"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--sand-3)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', minHeight: 72, color: 'var(--ink)', background: 'var(--white)' }} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: 'var(--sand)', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--ink-3)', fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                {file ? file.name.slice(0, 16) + '…' : 'Attach'}
                <input type="file" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
              <button onClick={sendMessage} disabled={sending || (!body && !file)}
                style={{ padding: '0.5rem 1.25rem', background: 'var(--ink)', color: 'var(--white)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: (!body && !file) ? 0.5 : 1 }}>
                {sending ? '…' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}