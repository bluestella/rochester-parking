import './globals.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Condo Parking',
  description: 'PWA for condominium parking monitoring',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
