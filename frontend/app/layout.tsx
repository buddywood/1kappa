import type { Metadata } from 'next'
import { Montserrat, Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-montserrat',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NorthStar Nupes - Where Brotherhood Meets the North Star',
  description: 'A Minnesota-rooted hub of Kappa creativity and excellence. Shop authentic merchandise from verified fraternity members.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  )
}

