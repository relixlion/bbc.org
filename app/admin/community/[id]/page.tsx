import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira, maskPhone } from '@/lib/format'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminCommunityToggle from './Toggle'

export default async function AdminCommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: post } = await supabaseAdmin
    .from('community_posts')
    .select('*, user:users(phone)')
    .eq('id', id)
    .single()

  if (!post) notFound()

  const phone = (post.user as { phone: string })?.phone ?? ''

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/community" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-3)', textDecoration: 'none', marginBottom: '1rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Back to community
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.375rem' }}>Post detail</div>
        <div className="t-caption">{new Date(post.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-label" style={{ marginBottom: '0.25rem' }}>Posted by</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>{maskPhone(phone)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="t-label" style={{ marginBottom: '0.25rem' }}>Amount shown</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(post.amount_shown ?? 0)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-label" style={{ marginBottom: '0.375rem' }}>Visibility</div>
            <span className={post.status === 'visible' ? 'pill pill-emerald' : 'pill pill-danger'}>
              {post.status === 'visible' ? 'Visible to all' : 'Hidden'}
            </span>
          </div>
          <AdminCommunityToggle id={post.id} status={post.status} />
        </div>

        {post.image_url ? (
          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--sand-2)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <img
              src={post.image_url}
              alt="withdrawal proof"
              style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '75vh' }}
            />
          </div>
        ) : (
          <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-lg)', padding: '3rem 1.5rem', textAlign: 'center', border: '1px solid #B7DFD0' }}>
            <div className="t-label" style={{ color: 'var(--emerald-2)', marginBottom: '0.5rem' }}>No image — amount only</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--emerald)', letterSpacing: '-0.03em' }}>{formatNaira(post.amount_shown ?? 0)}</div>
          </div>
        )}
      </div>
    </div>
  )
}