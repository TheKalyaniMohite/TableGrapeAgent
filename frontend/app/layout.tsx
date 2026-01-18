import type { Metadata } from 'next'
import './globals.css'
import StickyLanguageSelector from './components/StickyLanguageSelector'

export const metadata: Metadata = {
  title: 'AgriSight - Smart Farm Management',
  description: 'AgriSight: AI-powered farm management system for modern agriculture',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <StickyLanguageSelector />
      </body>
    </html>
  )
}
