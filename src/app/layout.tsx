import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { getBrandConfig } from '@/config/brand'
import { BrandProvider } from '@/components/shared/BrandProvider'
import { DemoStoreProvider } from '@/lib/demo/store'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig()
  return {
    title: `${brand.name} — ${brand.tagline}`,
    description: `${brand.name}: ${brand.tagline}`,
    themeColor: '#f5f5f7',
    icons: brand.faviconUrl ? { icon: brand.faviconUrl } : undefined,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = getBrandConfig()
  return (
    <html lang="en">
      <body>
        <BrandProvider config={brand}>
          <DemoStoreProvider>
            {children}
          </DemoStoreProvider>
        </BrandProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1d1d1f',
              color: '#f5f5f7',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            },
            success: { iconTheme: { primary: brand.primaryColor, secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ff3b30', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
