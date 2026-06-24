'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { X, Download, Loader2, ImageIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsCard, CARD_DIMS, type CardFormat } from './StatsCard'
import type { CheckIn, Profile, Project } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  project: Project
  checkins: CheckIn[]
  profile: Profile | null
  onClose: () => void
}

// Preview area constraints
const PREVIEW_MAX_W = 280
const PREVIEW_MAX_H = 420

function getScale(w: number, h: number) {
  return Math.min(PREVIEW_MAX_W / w, PREVIEW_MAX_H / h)
}

const FORMAT_ORDER: CardFormat[] = ['square', 'portrait', 'stories']

// Aspect-ratio thumbnail shapes for the format buttons
const THUMB: Record<CardFormat, { w: number; h: number }> = {
  square:   { w: 28, h: 28 },
  portrait: { w: 22, h: 28 },
  stories:  { w: 16, h: 28 },
}

export function ShareStatsModal({ project, checkins, profile, onClose }: Props) {
  const captureRef  = useRef<HTMLDivElement>(null)
  const [format, setFormat]       = useState<CardFormat>('square')
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded]   = useState(false)

  const { w, h, outW, outH } = CARD_DIMS[format]
  const scale   = getScale(w, h)
  const prevW   = Math.round(w * scale)
  const prevH   = Math.round(h * scale)

  const handleDownload = async () => {
    if (!captureRef.current) return
    setDownloading(true)
    try {
      // Capture the hidden full-size card (no transform), scale up 2× for output
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: false,
      })
      const slug = project.name.replace(/\s+/g, '-').toLowerCase()
      const link = document.createElement('a')
      link.download = `${slug}-stats-${format}.png`
      link.href = dataUrl
      link.click()
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    } catch (err) {
      console.error('Failed to export card:', err)
    } finally {
      setDownloading(false)
    }
  }

  const cardProps = { project, checkins, profile, format }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Share your stats</h2>
              <p className="text-xs text-muted-foreground">Pick a format and download</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Format selector ── */}
        <div className="px-6 pt-5 pb-0">
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Format</p>
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_ORDER.map((f) => {
              const d = CARD_DIMS[f]
              const t = THUMB[f]
              const active = f === format
              return (
                <button
                  key={f}
                  onClick={() => { setFormat(f); setDownloaded(false) }}
                  className={cn(
                    'flex flex-col items-center gap-2.5 rounded-xl border px-3 py-3 transition-all',
                    active
                      ? 'border-primary bg-primary/8 shadow-sm'
                      : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'
                  )}
                >
                  {/* Aspect-ratio thumbnail */}
                  <div
                    className={cn('rounded-[3px] border-2 transition-colors', active ? 'border-primary' : 'border-muted-foreground/40')}
                    style={{ width: t.w, height: t.h, background: active ? 'hsl(var(--primary) / 0.15)' : 'transparent' }}
                  />
                  <div className="text-center">
                    <p className={cn('text-xs font-semibold leading-tight', active ? 'text-primary' : 'text-foreground')}>{d.label}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{d.ratio}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/60">{d.outW}×{d.outH}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Preview ── */}
        <div
          className="flex items-center justify-center bg-[#030306] mx-6 mt-5 rounded-xl"
          style={{ height: PREVIEW_MAX_H + 32 }}
        >
          <div
            className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            style={{ width: prevW, height: prevH }}
          >
            {/* Scaled visual preview (CSS transform — no ref needed here) */}
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: w, height: h }}>
              <StatsCard {...cardProps} />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-6 py-5 space-y-3">
          <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2" size="lg">
            {downloading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Generating {outW}×{outH} PNG…</>
            ) : downloaded ? (
              <><Check className="h-4 w-4" />Saved — check your Downloads</>
            ) : (
              <><Download className="h-4 w-4" />Download {CARD_DIMS[format].label} PNG</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            {format === 'stories' && 'Optimised for Instagram Stories & TikTok.'}
            {format === 'portrait' && 'Great for Instagram feed, LinkedIn posts.'}
            {format === 'square'  && 'Universal — works on all platforms.'}
            {' '}
            <span className="text-primary font-medium">splynt.xyz</span> is embedded to grow your audience.
          </p>
        </div>
      </div>

      {/*
        Hidden full-size capture element — rendered off-screen with no CSS transform.
        html-to-image reads this element's natural CSS dimensions (w × h) and outputs
        at pixelRatio × that size, giving a clean 1080px+ export.
      */}
      <div
        style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, opacity: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        <StatsCard ref={captureRef} {...cardProps} />
      </div>
    </div>
  )
}
