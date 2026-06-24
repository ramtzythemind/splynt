'use client'

import { useState } from 'react'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { RoadmapView } from './RoadmapView'
import { IdeaValidator } from './IdeaValidator'
import { DailyCheckin } from './DailyCheckin'
import { LaunchChecklist } from './LaunchChecklist'
import { ProgressTimeline } from './ProgressTimeline'
import type { Project, CheckIn, ChatMessage, RoadmapMilestone, IdeaValidation, LaunchChecklistItem } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  project: Project
  recentCheckins: CheckIn[]
  initialChatMessages: ChatMessage[]
}

export function RoadmapClientView({ project: initialProject, recentCheckins: initialCheckins, initialChatMessages }: Props) {
  const [project, setProject] = useState<Project>({
    ...initialProject,
    roadmap: initialProject.roadmap ?? [],
    launch_checklist: initialProject.launch_checklist ?? [],
  })
  const [checkins, setCheckins] = useState<CheckIn[]>(initialCheckins)

  const handleRoadmapUpdate = async (roadmap: RoadmapMilestone[]) => {
    setProject(p => ({ ...p, roadmap }))
    const supabase = createClient()
    await supabase.from('projects').update({ roadmap }).eq('id', project.id)
  }

  const handleValidationUpdate = (idea_validation: IdeaValidation) => {
    setProject(p => ({ ...p, idea_validation }))
  }

  const handleChecklistUpdate = (launch_checklist: LaunchChecklistItem[]) => {
    setProject(p => ({ ...p, launch_checklist }))
  }

  const handleCheckinAdded = (checkin: CheckIn) => {
    setCheckins(prev => [checkin, ...prev])
  }

  const handleProjectUpdate = (updates: { name: string; description: string }) => {
    setProject(p => ({ ...p, ...updates }))
  }

  return (
    <div className="flex">
      {/* Main content — shrinks when chat panel is open (handled by CSS margin) */}
      <main className="flex-1 min-w-0 px-4 py-8 md:pr-4 transition-all duration-300">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Roadmap */}
          <RoadmapView
            project={project}
            onRoadmapUpdate={handleRoadmapUpdate}
            onProjectUpdate={handleProjectUpdate}
          />

          {/* Progress Timeline */}
          <ProgressTimeline milestones={project.roadmap} />

          {/* Idea Validator */}
          <IdeaValidator project={project} onUpdate={handleValidationUpdate} />

          {/* Daily Check-in */}
          <DailyCheckin
            project={project}
            recentCheckins={checkins}
            onCheckinAdded={handleCheckinAdded}
          />

          {/* Launch Checklist */}
          <LaunchChecklist project={project} onUpdate={handleChecklistUpdate} />
        </div>
      </main>

      {/* AI Chat Panel */}
      <ChatPanel
        project={project}
        recentCheckins={checkins}
        initialMessages={initialChatMessages}
        onRoadmapUpdate={handleRoadmapUpdate}
      />
    </div>
  )
}
