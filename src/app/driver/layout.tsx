import DemoNavbar from '@/components/shared/DemoNavbar'
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <DemoNavbar role="driver" />
      <main className="pt-[60px] pb-[80px] md:pb-6 max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
