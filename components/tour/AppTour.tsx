'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Step {
  target?: string   // CSS selector — omit for a centered "no spotlight" step
  title: string
  description: string
  icon: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Splynt',
    description: "Your startup roadmap is ready. Let's take 30 seconds to show you how everything fits together.",
    icon: '🚀',
  },
  {
    target: '[data-tour="roadmap"]',
    title: 'Your AI-Generated Roadmap',
    description: 'Your personalized milestone plan lives here. Click any milestone to expand it and check off tasks as you ship.',
    icon: '🗺️',
    position: 'bottom',
  },
  {
    target: '[data-tour="momentum"]',
    title: 'Founder Momentum Score',
    description: 'Your score grows as you complete tasks and log daily check-ins. Build a streak to reach Unstoppable status.',
    icon: '🔥',
    position: 'top',
  },
  {
    target: '[data-tour="checkin"]',
    title: 'Daily Check-ins Build Streaks',
    description: 'Log progress, blockers, and next steps every day. Your AI advisor reads every entry to give you better advice.',
    icon: '📓',
    position: 'top',
  },
  {
    target: '[data-tour="chat"]',
    title: 'Your Personal AI Advisor',
    description: 'Splynt AI knows your idea, your roadmap, and your check-ins. Ask it anything — it can even update your roadmap.',
    icon: '🤖',
    position: 'left',
  },
  {
    target: '[data-tour="project-settings"]',
    title: 'Build in Public',
    description: 'Share your startup journey with a public build page. Enable it in Project Settings to get your shareable link.',
    icon: '🌐',
    position: 'bottom',
  },
]

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

const TOOLTIP_W = 320
const TOOLTIP_H = 176
const GAP = 14
const PAD = 8

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function getTooltipPos(rect: SpotlightRect, position: Step['position']): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = 0
  let left = 0

  switch (position) {
    case 'bottom':
      top = rect.top + rect.height + PAD + GAP
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2
      break
    case 'top':
      top = rect.top - PAD - GAP - TOOLTIP_H
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2
      break
    case 'right':
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2
      left = rect.left + rect.width + PAD + GAP
      break
    case 'left':
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2
      left = rect.left - PAD - GAP - TOOLTIP_W
      break
    default:
      top = vh / 2 - TOOLTIP_H / 2
      left = vw / 2 - TOOLTIP_W / 2
  }

  return {
    top: clamp(top, 12, vh - TOOLTIP_H - 12),
    left: clamp(left, 12, vw - TOOLTIP_W - 12),
  }
}

export function AppTour({ userId, onDone }: { userId: string; onDone: () => void }) {
  const STORAGE_KEY = `splynt_tour_done_${userId}`

  const [step, setStep] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const [visible, setVisible] = useState(false)

  const current = STEPS[step]

  const positionStep = useCallback((stepIndex: number) => {
    const s = STEPS[stepIndex]

    if (!s.target) {
      setSpotlight(null)
      setTooltipPos({
        top: window.innerHeight / 2 - TOOLTIP_H / 2,
        left: window.innerWidth / 2 - TOOLTIP_W / 2,
      })
      return
    }

    const el = document.querySelector(s.target)
    if (!el) {
      // Element not found — skip spotlight, center card
      setSpotlight(null)
      setTooltipPos({
        top: window.innerHeight / 2 - TOOLTIP_H / 2,
        left: window.innerWidth / 2 - TOOLTIP_W / 2,
      })
      return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // Wait for scroll animation
    setTimeout(() => {
      const r = el.getBoundingClientRect()
      const rect: SpotlightRect = {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      }
      setSpotlight(rect)
      setTooltipPos(getTooltipPos(rect, s.position))
    }, 380)
  }, [])

  useEffect(() => {
    // Small delay so DOM is ready
    const t = setTimeout(() => {
      setVisible(true)
      positionStep(0)
    }, 300)
    return () => clearTimeout(t)
  }, [positionStep])

  useEffect(() => {
    const handleResize = () => positionStep(step)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step, positionStep])

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setSpotlight(null)
      const next = step + 1
      setStep(next)
      positionStep(next)
    } else {
      finish()
    }
  }

  const goPrev = () => {
    if (step > 0) {
      setSpotlight(null)
      const prev = step - 1
      setStep(prev)
      positionStep(prev)
    }
  }

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    setTimeout(onDone, 200)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9996] transition-opacity duration-200"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={finish}
      />

      {/* Spotlight ring — rendered on top of the backdrop, punches through visually via box-shadow */}
      {spotlight && (
        <div
          className="fixed z-[9997] rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlight.top - PAD,
            left: spotlight.left - PAD,
            width: spotlight.width + PAD * 2,
            height: spotlight.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.0), inset 0 0 0 2px hsl(262 80% 60% / 0.8)',
            border: '2px solid hsl(262 80% 60% / 0.7)',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className={cn(
          'fixed z-[9998] w-80 rounded-2xl border border-border bg-card shadow-2xl',
          'transition-all duration-200',
        )}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_W,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          {/* Progress pips */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step
                    ? 'w-5 bg-primary'
                    : i < step
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>
          <button
            onClick={finish}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{current.icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight">{current.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={step === 0}
            className="h-8 gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {step + 1} / {STEPS.length}
          </span>

          <Button size="sm" onClick={goNext} className="h-8 gap-1.5 text-xs">
            {step === STEPS.length - 1 ? (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Let&apos;s go
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
