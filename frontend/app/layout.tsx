import type { Metadata } from 'next'
import { Oswald, Inter, Playfair_Display } from 'next/font/google'
import Providers from './components/Providers'
import SessionManager from './components/SessionManager'
import './globals.css'

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
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
  title: '1Kappa | One Brotherhood. Infinite Impact',
  description: 'A digital home for Kappa brothers worldwide. Community, Commerce, Culture, and Contribution. Shop authentic merchandise from verified fraternity members.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable} ${playfair.variable}`}>
      <body>
        <Providers>
          <SessionManager />
          {children}
        </Providers>
      </body>
    </html>
  )
}

