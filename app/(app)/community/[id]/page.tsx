import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira, maskPhone } from '@/lib/format'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: post } = await supabaseAdmin
    .from('community_posts')
    .select('*, user:users(phone)')
    .eq('id', id)
    .eq('status', 'visible')
    .single()

  if (!post) notFound()

  const phone = (post.user as { phone: string })?.phone ?? ''

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <Link href="/community" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Community
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>
          {formatNaira(post.amount_shown ?? 0)}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>Withdrawal confirmed</div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* User info */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--white)' }}>{maskPhone(phone).slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div className="t-body" style={{ fontWeight: 700 }}>{maskPhone(phone)}</div>
            <div className="t-caption">{new Date(post.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        {/* Image — full size */}
        {post.image_url ? (
          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--sand-2)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <img
              src={post.image_url}
              alt="withdrawal proof"
              style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '70vh' }}
            />
          </div>
        ) : (
          <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-lg)', padding: '3rem 1.5rem', textAlign: 'center', border: '1px solid #B7DFD0' }}>
            <div className="t-label" style={{ color: 'var(--emerald-2)', marginBottom: '0.5rem' }}>Withdrawal confirmed</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--emerald)', letterSpacing: '-0.03em' }}>{formatNaira(post.amount_shown ?? 0)}</div>
          </div>
        )}

        {/* Amount card */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-label" style={{ marginBottom: '0.25rem' }}>Amount withdrawn</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(post.amount_shown ?? 0)}</div>
          </div>
          <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-sm)', padding: '0.5rem 1rem' }}>
            <span className="pill pill-emerald">Verified</span>
          </div>
        </div>

        <Link href="/products" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: 'var(--emerald)', borderRadius: 'var(--r-lg)', padding: '1.125rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.125rem' }}>Start earning like this</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Browse investment plans</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
          </div>
        </Link>
      </div>
    </div>
  )
}