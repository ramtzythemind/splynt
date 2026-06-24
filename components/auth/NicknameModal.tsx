'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  firstName?: string | null
  onDone: () => void
}

export function NicknameModal({ firstName, onDone }: Props) {
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) return
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ nickname: trimmed })
        .eq('id', user.id)
      if (dbErr) throw dbErr
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Logo + greeting */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">
              {firstName ? `Hey, ${firstName}! 👋` : 'Welcome to Splynt! 👋'}
            </h2>
            <p className="text-sm text-muted-foreground">One quick thing before we start</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
          What should we call you in the app? This will appear on your stats card and public build page.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-0 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
            <span className="text-muted-foreground font-mono">@</span>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))}
              placeholder="yourhandle"
              className="border-0 bg-transparent px-0 font-mono shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
              maxLength={32}
              onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && handleSave()}
            />
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {nickname.length}/32
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={!nickname.trim() || saving}
            className="w-full gap-2"
            size="lg"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <>Let&apos;s go <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>

          <button
            onClick={onDone}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
