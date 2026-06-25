'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !handle.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/beta/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), handle: handle.trim().replace(/^@/, '') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 px-6 py-5 text-center">
        <CheckCircle2 className="h-6 w-6 text-green-500" />
        <div>
          <p className="font-semibold">You&apos;re on the list!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll reach out to <span className="font-medium text-foreground">{email}</span> when your spot is ready.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-3">
      <div className="flex gap-2">
        {/* Handle field with @ prefix */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm select-none">
            @
          </span>
          <Input
            type="text"
            placeholder="yourhandle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/^@/, '').replace(/\s/g, ''))}
            required
            className="h-12 pl-7 font-mono"
            title="Your X or GitHub handle"
          />
        </div>

        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 flex-1"
        />
      </div>

      <p className="text-xs text-muted-foreground text-left">
        X (Twitter) or GitHub handle — we use this to reach out and know who&apos;s building.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !email.trim() || !handle.trim()}
        className="w-full h-12 gap-2 text-base"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving your spot…</>
        ) : (
          <>Request beta access <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    </form>
  )
}
