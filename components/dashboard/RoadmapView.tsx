'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import type { Project, RoadmapMilestone, RoadmapTask } from '@/types'
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { ProjectSettings } from './ProjectSettings'
import { Button } from '@/components/ui/button'

const PHASE_COLORS: Record<string, string> = {
  validation: 'bg-blue-500/10 text-blue-600 border-blue-200',
  build: 'bg-orange-500/10 text-orange-600 border-orange-200',
  launch: 'bg-green-500/10 text-green-600 border-green-200',
  growth: 'bg-purple-500/10 text-purple-600 border-purple-200',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
}

function StatusIcon({ status }: { status: RoadmapTask['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
  if (status === 'in_progress') return <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
  return <Circle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
}

interface RoadmapViewProps {
  project: Project
  onRoadmapUpdate?: (roadmap: RoadmapMilestone[]) => void
  onProjectUpdate?: (updates: { name: string; description: string }) => void
}

export function RoadmapView({ project, onRoadmapUpdate, onProjectUpdate }: RoadmapViewProps) {
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[]>(project.roadmap ?? [])
  const [regenerating, setRegenerating] = useState(false)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch('/api/roadmap/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      const data = await res.json()
      if (res.ok && data.roadmap?.length > 0) {
        setRoadmap(data.roadmap)
        onRoadmapUpdate?.(data.roadmap)
      }
    } finally {
      setRegenerating(false)
    }
  }
  const [openMilestones, setOpenMilestones] = useState<Set<string>>(() => {
    const inProgress = (project.roadmap ?? []).find((m) => m.status !== 'completed')
    return new Set(inProgress ? [inProgress.id] : [])
  })
  const [, startTransition] = useTransition()

  // Sync if parent updates the roadmap (e.g. from chat)
  if (roadmap !== project.roadmap && project.roadmap !== roadmap) {
    // no-op: parent manages this through prop
  }

  const toggleMilestone = (id: string) => {
    setOpenMilestones((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleTask = async (milestoneId: string, taskId: string) => {
    const updated = roadmap.map((m) => {
      if (m.id !== milestoneId) return m
      const tasks = (m.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t
        return { ...t, status: t.status === 'completed' ? ('pending' as const) : ('completed' as const) }
      })
      const allDone = tasks.every((t) => t.status === 'completed')
      const anyDone = tasks.some((t) => t.status === 'completed')
      return {
        ...m,
        tasks,
        status: allDone ? ('completed' as const) : anyDone ? ('in_progress' as const) : ('pending' as const),
      }
    })

    setRoadmap(updated)
    onRoadmapUpdate?.(updated)

    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('projects')
        .update({ roadmap: updated })
        .eq('id', project.id)
    })
  }

  const completedMilestones = roadmap.filter((m) => m.status === 'completed').length
  const totalProgress = roadmap.length ? Math.round((completedMilestones / roadmap.length) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <p className="mt-1 text-muted-foreground line-clamp-2">{project.description}</p>
            </div>
            {onProjectUpdate && (
              <div className="mt-1.5 flex-shrink-0">
                <ProjectSettings project={project} onUpdate={onProjectUpdate} />
              </div>
            )}
          </div>
          <Badge variant="secondary" className="w-fit text-sm px-3 py-1">
            {completedMilestones}/{roadmap.length} milestones
          </Badge>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Overall progress</span>
            <span className="font-medium">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Milestones */}
      {roadmap.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-semibold">Roadmap is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The roadmap data is missing. Regenerate it from your original answers.
          </p>
          <Button onClick={handleRegenerate} disabled={regenerating} className="mt-4 gap-2">
            <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate Roadmap'}
          </Button>
        </div>
      ) : (
      <div className="space-y-4">
        {roadmap.map((milestone, idx) => {
          const isOpen = openMilestones.has(milestone.id)
          const tasks = milestone.tasks ?? []
          const completedTasks = tasks.filter((t) => t.status === 'completed').length
          const milestoneProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0

          return (
            <div
              key={milestone.id}
              className={`rounded-2xl border transition-all ${
                milestone.status === 'completed'
                  ? 'border-border/40 bg-muted/30'
                  : 'border-border/60 bg-card shadow-sm'
              }`}
            >
              <button
                onClick={() => toggleMilestone(milestone.id)}
                className="flex w-full items-center gap-4 p-6 text-left"
              >
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  milestone.status === 'completed'
                    ? 'bg-primary text-primary-foreground'
                    : milestone.status === 'in_progress'
                    ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-200'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {milestone.status === 'completed' ? '✓' : idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-semibold text-lg ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {milestone.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${PHASE_COLORS[milestone.phase] || ''}`}
                    >
                      {milestone.phase}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{milestone.timeframe}</span>
                    <span>·</span>
                    <span>{completedTasks}/{tasks.length} tasks</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:block w-24">
                    <Progress value={milestoneProgress} className="h-1.5" />
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border/60 px-6 pb-6 pt-4">
                  <p className="mb-4 text-sm text-muted-foreground">{milestone.description}</p>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => toggleTask(milestone.id, task.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-background px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                      >
                        <StatusIcon status={task.status} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        <span className={`text-xs font-medium capitalize flex-shrink-0 ${PRIORITY_COLORS[task.priority] || ''}`}>
                          {task.priority}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
