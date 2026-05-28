import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import ConditionalLayout from '@/components/ConditionalLayout'
import { Toaster } from 'sonner'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'OvusCare — Doctor Dashboard',
  description: 'IVF patient management dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
        <I18nProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                fontSize: '14px',
              },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  )
}
