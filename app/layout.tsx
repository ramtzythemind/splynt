import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/app/components/ThemeProvider'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
})

const BASE_URL = 'https://splynt.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Splynt — Build your startup, one milestone at a time',
    template: '%s | Splynt',
  },
  description: 'Splynt is the AI-powered product builder for early-stage founders. Turn your startup idea into a structured roadmap with AI milestones, daily check-ins, momentum tracking, and a personal AI advisor.',
  keywords: [
    'startup builder', 'AI startup tool', 'startup roadmap', 'product roadmap AI',
    'founder productivity', 'startup milestones', 'early stage founder', 'build in public',
    'startup accountability', 'AI advisor for founders', 'MVP builder', 'startup launch checklist',
  ],
  authors: [{ name: 'Splynt', url: BASE_URL }],
  creator: 'Splynt',
  publisher: 'Splynt',
  applicationName: 'Splynt',
  category: 'productivity',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'Splynt — Build your startup, one milestone at a time',
    description: 'Turn your startup idea into a structured roadmap with AI milestones, daily check-ins, and a personal AI advisor. Built for early-stage founders.',
    url: BASE_URL,
    siteName: 'Splynt',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Splynt — Build your startup, one milestone at a time',
    description: 'Turn your startup idea into a structured roadmap with AI milestones, daily check-ins, and a personal AI advisor.',
    site: '@splynt',
    creator: '@splynt',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
