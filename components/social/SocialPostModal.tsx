'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project, RoadmapMilestone } from '@/types'

type Platform = 'twitter' | 'linkedin' | 'threads'

const PLATFORMS: { id: Platform; label: string; emoji: string; charLimit?: number }[] = [
  { id: 'twitter', label: 'X / Twitter', emoji: '𝕏', charLimit: 280 },
  { id: 'linkedin', label: 'LinkedIn', emoji: 'in' },
  { id: 'threads', label: 'Threads', emoji: '@' },
]

interface Props {
  project: Project
  milestone: RoadmapMilestone
  onClose: () => void
}

export function SocialPostModal({ project, milestone, onClose }: Props) {
  const [posts, setPosts] = useState<Record<Platform, string> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<Platform>('twitter')
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, milestoneId: milestone.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPosts(data.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyText = async () => {
    if (!posts) return
    await navigator.clipboard.writeText(posts[activePlatform])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activePost = posts?.[activePlatform] ?? ''
  const charLimit = PLATFORMS.find((p) => p.id === activePlatform)?.charLimit
  const overLimit = charLimit ? activePost.length > charLimit : false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Share this win</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[280px]">{milestone.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!posts && !loading && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Generate ready-to-post copy for Twitter/X, LinkedIn, and Threads — tailored to your milestone.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={generate} className="gap-2">
                <Share2 className="h-4 w-4" />
                Generate posts
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Writing your posts...</p>
            </div>
          )}

          {posts && (
            <>
              {/* Platform tabs */}
              <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePlatform(p.id)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                      activePlatform === p.id
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="font-mono text-[11px]">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Post content */}
              <div className="relative">
                <textarea
                  value={activePost}
                  onChange={(e) =>
                    setPosts((prev) => prev ? { ...prev, [activePlatform]: e.target.value } : prev)
                  }
                  className="w-full min-h-[160px] resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {charLimit && (
                  <span
                    className={cn(
                      'absolute bottom-3 right-3 font-mono text-[10px]',
                      overLimit ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {activePost.length}/{charLimit}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyText}
                  className="flex-1 gap-2"
                  variant={copied ? 'secondary' : 'default'}
                >
                  {copied ? (
                    <><Check className="h-4 w-4" /> Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4" /> Copy</>
                  )}
                </Button>
                <Button variant="outline" onClick={generate} disabled={loading} className="gap-1.5">
                  <Loader2 className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                  Regenerate
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
