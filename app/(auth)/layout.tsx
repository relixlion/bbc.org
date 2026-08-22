export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100svh', background: 'var(--sand)', boxShadow: '0 0 0 1px var(--sand-3)', position: 'relative' }}>
      {children}
    </div>
  )
}