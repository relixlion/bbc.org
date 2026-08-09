import { supabaseAdmin } from '@/lib/supabase'
import { formatNaira, maskPhone } from '@/lib/format'
import Link from 'next/link'

export default async function CommunityPage() {
  const { data: posts } = await supabaseAdmin
    .from('community_posts')
    .select('*, user:users(phone)')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(50)

  const total = posts?.reduce((s, p) => s + (p.amount_shown ?? 0), 0) ?? 0
  const today = posts?.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length ?? 0

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="page-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--white)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Real payouts, shared.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {[{ val: String(posts?.length ?? 0), lab: 'Posts' }, { val: formatNaira(total), lab: 'Paid out' }, { val: `+${today}`, lab: 'Today' }].map(({ val, lab }) => (
            <div key={lab} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--white)', letterSpacing: '-0.02em' }}>{val}</div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '0.125rem' }}>{lab}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Link href="/community/post" className="btn btn-amber" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Share your withdrawal
        </Link>

        {posts?.map((post) => {
          const phone = (post.user as { phone: string })?.phone ?? ''
          return (
            <Link key={post.id} href={`/community/${post.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--white)' }}>{maskPhone(phone).slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="t-body" style={{ fontWeight: 600 }}>{maskPhone(phone)}</div>
                    <div className="t-caption">{new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--emerald)', letterSpacing: '-0.02em', flexShrink: 0 }}>
                    {formatNaira(post.amount_shown ?? 0)}
                  </div>
                </div>

                {post.image_url ? (
                  <div style={{ position: 'relative', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--sand-2)' }}>
                    <img
                      src={post.image_url}
                      alt="withdrawal proof"
                      style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover', borderRadius: 'var(--r-sm)' }}
                    />
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '3px 8px', fontSize: '0.6875rem', fontWeight: 600, color: '#fff' }}>
                      Tap to view
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--emerald-bg)', borderRadius: 'var(--r-sm)', padding: '1.25rem', textAlign: 'center' }}>
                    <div className="t-label" style={{ color: 'var(--emerald-2)', marginBottom: '0.375rem' }}>Withdrawal confirmed</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--emerald)', letterSpacing: '-0.02em' }}>{formatNaira(post.amount_shown ?? 0)}</div>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
        {!posts?.length && (
          <div className="t-caption" style={{ textAlign: 'center', padding: '3rem 0' }}>No posts yet. Be the first to share.</div>
        )}
      </div>
    </div>
  )
}