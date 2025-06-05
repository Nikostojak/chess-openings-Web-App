import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '../components/ui/Navigation'
import { createTempUser } from '../lib/seed'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpeningForge',
  description: 'Forge your chess opening mastery',
}

// Create temp user on startup
createTempUser()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}