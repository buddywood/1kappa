import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'North Star Nupes - Verified Fraternity Member Marketplace',
  description: 'A verified fraternity member marketplace for selling branded merchandise',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

