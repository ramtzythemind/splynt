'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function BetaActivatePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid code. Check for typos and try again.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            Splynt
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <h2 className="text-xl font-bold">You&apos;re in!</h2>
              <p className="text-sm text-muted-foreground">Beta access granted. Redirecting…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Enter your invite code</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Splynt is currently in closed beta. You need an invite code to access the app.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  placeholder="BETA-XXXXXXXX"
                  className="h-12 font-mono text-base tracking-widest text-center"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && code.trim() && handleRedeem()}
                />

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  onClick={handleRedeem}
                  disabled={!code.trim() || loading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</>
                  ) : (
                    <>Activate access <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground">no code?</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Join the waitlist and we&apos;ll reach out when spots open up.{' '}
                <Link href="/#waitlist" className="font-medium text-primary hover:underline">
                  Apply now →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
