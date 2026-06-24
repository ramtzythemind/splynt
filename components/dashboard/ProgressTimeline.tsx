'use client'

import { useState } from 'react'
import type { RoadmapMilestone } from '@/types'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'

const PHASE_COLORS: Record<string, { dot: string; badge: string }> = {
  validation: { dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  build: { dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  launch: { dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' },
  growth: { dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
}

interface Props {
  milestones: RoadmapMilestone[]
}

export function ProgressTimeline({ milestones: rawMilestones }: Props) {
  const milestones = rawMilestones ?? []
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
      >
        <div>
          <p className="font-semibold">Progress Timeline</p>
          <p className="text-xs text-muted-foreground">
            {milestones.filter(m => m.status === 'completed').length} of {milestones.length} milestones complete
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-5 pb-6 pt-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-6">
              {milestones.map((milestone, idx) => {
                const colors = PHASE_COLORS[milestone.phase] ?? PHASE_COLORS.build
                const tasks = milestone.tasks ?? []
                const completedTasks = tasks.filter(t => t.status === 'completed').length

                return (
                  <div key={milestone.id} className="flex gap-4">
                    {/* Dot */}
                    <div className="relative flex-shrink-0 z-10">
                      <div className={`
                        flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold
                        ${milestone.status === 'completed'
                          ? 'bg-primary'
                          : milestone.status === 'in_progress'
                          ? `${colors.dot} ring-4 ring-offset-2 ring-offset-card ring-primary/20`
                          : 'bg-muted text-muted-foreground'}
                      `}>
                        {milestone.status === 'completed' ? '✓' : idx + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className={`font-medium text-sm ${milestone.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{milestone.timeframe}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs capitalize border ${colors.badge}`}>
                            {milestone.phase}
                          </Badge>
                          {milestone.status === 'in_progress' && (
                            <Badge variant="secondary" className="text-xs">In progress</Badge>
                          )}
                        </div>
                      </div>

                      {/* Task mini-progress */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex gap-1">
                          {tasks.map(task => (
                            <div
                              key={task.id}
                              className={`h-1.5 w-3 rounded-full transition-colors ${
                                task.status === 'completed' ? 'bg-primary' : 'bg-border'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {completedTasks}/{tasks.length} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
