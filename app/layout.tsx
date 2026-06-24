import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Splynt — Build your startup, one milestone at a time',
  description: 'AI-powered product builder that helps founders go from idea to launch with structure and clarity.',
  keywords: ['startup', 'product builder', 'roadmap', 'founder', 'AI'],
  openGraph: {
    title: 'Splynt — Build your startup, one milestone at a time',
    description: 'AI-powered product builder that helps founders go from idea to launch.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
