'use client'

import type { CheckIn, Project } from '@/types'
import { Flame, Zap, Rocket } from 'lucide-react'
import { computeStreak, computeMomentumScore, getTier } from '@/lib/momentum'

interface Props {
  project: Project
  checkins: CheckIn[]
}

export function MomentumWidget({ project, checkins }: Props) {
  const streak = computeStreak(checkins)
  const score = computeMomentumScore(project, checkins)
  const tier = getTier(score)
  const { Icon } = tier

  const allTasks = project.roadmap.flatMap((m) => m.tasks ?? [])
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length

  const circumference = 2 * Math.PI * 42
  const dashOffset = circumference * (1 - score / 100)

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm" data-tour="momentum">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Founder Momentum</h2>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${tier.bgColor}`}>
          <Icon className={`h-3.5 w-3.5 ${tier.textColor}`} />
          <span className={`text-xs font-semibold ${tier.textColor}`}>{tier.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Score ring */}
        <div className="relative flex h-28 w-28 flex-shrink-0 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/40" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`${tier.ringColor} transition-all duration-700`}
            />
          </svg>
          <div className="text-center">
            <p className="text-3xl font-bold leading-none">{score}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">/ 100</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 flex-shrink-0">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{streak} day{streak !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground">Check-in streak</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{completedTasks} / {allTasks.length} tasks</p>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {checkins.filter((c) => new Date(c.created_at).getTime() > Date.now() - 7 * 86400000).length} this week
              </p>
              <p className="text-xs text-muted-foreground">Recent check-ins</p>
            </div>
          </div>
        </div>
      </div>

      {streak === 0 && (
        <p className="mt-4 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          Log a check-in today to start your streak and boost your momentum score.
        </p>
      )}
    </div>
  )
}
