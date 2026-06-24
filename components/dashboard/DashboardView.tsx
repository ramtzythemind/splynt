'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Profile, Project, RoadmapMilestone } from '@/types'
import { ArrowRight, Plus, Target } from 'lucide-react'
import { NicknameModal } from '@/components/auth/NicknameModal'

function getProjectProgress(roadmap: RoadmapMilestone[]): number {
  if (!roadmap?.length) return 0
  const completed = roadmap.filter((m) => m.status === 'completed').length
  return Math.round((completed / roadmap.length) * 100)
}

function getCurrentPhase(roadmap: RoadmapMilestone[]): string {
  if (!roadmap?.length) return 'Not started'
  const inProgress = roadmap.find((m) => m.status === 'in_progress')
  if (inProgress) return inProgress.title
  const pending = roadmap.find((m) => m.status === 'pending')
  if (pending) return pending.title
  return 'Completed'
}

export function DashboardView({ projects, profile }: { projects: Project[]; profile: Profile | null }) {
  const [showNickname, setShowNickname] = useState(!profile?.nickname)

  return (
    <div>
      {showNickname && (
        <NicknameModal
          firstName={profile?.first_name}
          onDone={() => setShowNickname(false)}
        />
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p className="mt-1 text-muted-foreground">Track your startup roadmaps and milestones</p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = getProjectProgress(project.roadmap)
          const currentPhase = getCurrentPhase(project.roadmap)
          const completedMilestones = project.roadmap?.filter((m) => m.status === 'completed').length ?? 0
          const totalMilestones = project.roadmap?.length ?? 0

          return (
            <Card key={project.id} className="group transition-shadow hover:shadow-md hover:shadow-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {progress}% done
                  </Badge>
                </div>
                <CardTitle className="mt-3 line-clamp-2 text-lg leading-snug">
                  {project.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-sm">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>Overall progress</span>
                    <span>{completedMilestones}/{totalMilestones} milestones</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Current focus</p>
                    <p className="text-sm font-medium">{currentPhase}</p>
                  </div>
                  <Link
                    href={`/roadmap/${project.id}`}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors opacity-0 group-hover:opacity-100"
                  >
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
