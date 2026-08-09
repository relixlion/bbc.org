import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import BottomNav from '@/components/app/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100svh', background: 'var(--sand)', position: 'relative' }}>
      <main style={{ paddingBottom: '5rem' }}>{children}</main>
      <BottomNav />
    </div>
  )
}
