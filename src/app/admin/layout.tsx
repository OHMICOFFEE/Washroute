import DemoNavbar from '@/components/shared/DemoNavbar'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <DemoNavbar role="admin" />
      <main className="pt-[60px] pb-[80px] md:pb-6 max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
