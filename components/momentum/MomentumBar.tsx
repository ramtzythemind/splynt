'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Flame, Zap, CheckCircle2, CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeStreak, computeMomentumScore, getTier } from '@/lib/momentum'
import type { CheckIn, Project } from '@/types'

interface Stat {
  id: string
  Icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  value: string
  label: string
  sublabel: string
}

function buildStats(project: Project, checkins: CheckIn[]): Stat[] {
  const score = computeMomentumScore(project, checkins)
  const streak = computeStreak(checkins)
  const tier = getTier(score)
  const allTasks = project.roadmap.flatMap((m) => m.tasks ?? [])
  const done = allTasks.filter((t) => t.status === 'completed').length
  const weekly = checkins.filter((c) => new Date(c.created_at).getTime() > Date.now() - 7 * 86400000).length

  return [
    {
      id: 'score',
      Icon: tier.Icon,
      iconBg: tier.bgColor,
      iconColor: tier.textColor,
      value: String(score),
      label: 'Momentum Score',
      sublabel: tier.label,
    },
    {
      id: 'streak',
      Icon: Flame,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
      value: String(streak),
      label: streak === 1 ? 'day streak' : 'days streak',
      sublabel: streak > 0 ? 'Keep it up!' : 'Start today',
    },
    {
      id: 'tasks',
      Icon: CheckCircle2,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      value: `${done}/${allTasks.length}`,
      label: 'tasks done',
      sublabel: allTasks.length ? `${Math.round((done / allTasks.length) * 100)}% complete` : 'No tasks yet',
    },
    {
      id: 'weekly',
      Icon: CalendarCheck,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      value: String(weekly),
      label: 'check-ins this week',
      sublabel: weekly > 0 ? 'Great momentum!' : 'None yet',
    },
  ]
}

const INTERVAL_MS = 4000
const ANIM_MS = 280

interface Props {
  project: Project
  checkins: CheckIn[]
}

export function MomentumBar({ project, checkins }: Props) {
  const stats = buildStats(project, checkins)

  const [activeIdx, setActiveIdx] = useState(0)
  const [exitIdx, setExitIdx] = useState<number | null>(null)
  // progress bar width (0→100) for the auto-advance timer
  const [progress, setProgress] = useState(0)

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const advance = useCallback((to?: number) => {
    setExitIdx((prev) => (prev !== null ? prev : activeIdx))
    const next = to !== undefined ? to : (activeIdx + 1) % stats.length
    setActiveIdx(next)
    setTimeout(() => setExitIdx(null), ANIM_MS + 20)
    setProgress(0)
  }, [activeIdx, stats.length])

  // Auto-advance every INTERVAL_MS
  useEffect(() => {
    setProgress(0)

    const tick = INTERVAL_MS / 100
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return p
        return p + 1
      })
    }, tick)

    advanceRef.current = setTimeout(() => advance(), INTERVAL_MS)

    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
      if (advanceRef.current) clearTimeout(advanceRef.current)
    }
  }, [activeIdx, advance])

  const handleDotClick = (i: number) => {
    if (i === activeIdx) return
    if (progressRef.current) clearInterval(progressRef.current)
    if (advanceRef.current) clearTimeout(advanceRef.current)
    advance(i)
  }

  const activeStat = stats[activeIdx]
  const exitStat = exitIdx !== null ? stats[exitIdx] : null

  return (
    <div className="sticky top-16 z-30 border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-12 items-center justify-between gap-4">

          {/* Cycling stat */}
          <button
            onClick={() => {
              if (progressRef.current) clearInterval(progressRef.current)
              if (advanceRef.current) clearTimeout(advanceRef.current)
              advance()
            }}
            className="relative flex min-w-0 flex-1 items-center overflow-hidden"
            aria-label="Next stat"
          >
            {/* Exiting */}
            {exitStat && (
              <div
                className="absolute inset-0 flex items-center gap-2.5 animate-out fade-out slide-out-to-top-2 fill-mode-forwards"
                style={{ animationDuration: `${ANIM_MS}ms` }}
              >
                <StatInner stat={exitStat} />
              </div>
            )}

            {/* Active */}
            <div
              key={activeIdx}
              className={cn(
                'flex items-center gap-2.5',
                exitStat
                  ? 'animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards'
                  : ''
              )}
              style={exitStat ? { animationDuration: `${ANIM_MS}ms` } : undefined}
            >
              <StatInner stat={activeStat} />
            </div>
          </button>

          {/* Right: dots + progress hint */}
          <div className="flex flex-shrink-0 items-center gap-3">
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {stats.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === activeIdx
                      ? 'w-4 h-1.5 bg-primary'
                      : 'w-1.5 h-1.5 bg-border hover:bg-muted-foreground'
                  )}
                  aria-label={`Go to stat ${i + 1}`}
                />
              ))}
            </div>

            {/* Thin progress sliver */}
            <div className="h-5 w-px bg-border/60" />
            <div className="relative h-1 w-12 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-primary/50 transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatInner({ stat }: { stat: Stat }) {
  return (
    <>
      <div className={cn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md', stat.iconBg)}>
        <stat.Icon className={cn('h-3.5 w-3.5', stat.iconColor)} />
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-base font-bold tabular-nums leading-none">{stat.value}</span>
        <span className="text-sm text-foreground/80 leading-none truncate">{stat.label}</span>
        <span className="hidden sm:block text-xs text-muted-foreground leading-none">·  {stat.sublabel}</span>
      </div>
    </>
  )
}
