import Link from 'next/link'
import { Zap } from 'lucide-react'
import { ThemeToggle } from '@/app/components/ThemeToggle'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              Splynt
            </Link>
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {children}
      </main>

      <footer className="border-t border-border/60 px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} Splynt. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/legal/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
