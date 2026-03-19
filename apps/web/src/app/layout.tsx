import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mavis — Revenue Intelligence Platform',
  description: 'AI-powered B2B outreach and deal intelligence',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
