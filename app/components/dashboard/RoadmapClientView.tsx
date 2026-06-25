'use client'

import { useState } from 'react'
import { ChatPanel } from '@/app/components/chat/ChatPanel'
import { RoadmapView } from './RoadmapView'
import { IdeaValidator } from './IdeaValidator'
import { DailyCheckin } from './DailyCheckin'
import { LaunchChecklist } from './LaunchChecklist'
import { ProgressTimeline } from './ProgressTimeline'
import { MomentumWidget } from '@/app/components/momentum/MomentumWidget'
import { MomentumBar } from '@/app/components/momentum/MomentumBar'
import { AppTour } from '@/app/components/tour/AppTour'
import { ShareStatsModal } from '@/app/components/social/ShareStatsModal'
import type { Project, CheckIn, ChatMessage, RoadmapMilestone, IdeaValidation, LaunchChecklistItem, Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  project: Project
  recentCheckins: CheckIn[]
  initialChatMessages: ChatMessage[]
  isFirstProject: boolean
  userId: string
  profile: Profile | null
}

export function RoadmapClientView({ project: initialProject, recentCheckins: initialCheckins, initialChatMessages, isFirstProject, userId, profile }: Props) {
  const [project, setProject] = useState<Project>({
    ...initialProject,
    roadmap: initialProject.roadmap ?? [],
    launch_checklist: initialProject.launch_checklist ?? [],
  })
  const [checkins, setCheckins] = useState<CheckIn[]>(initialCheckins)

  const [showShareModal, setShowShareModal] = useState(false)

  const [showTour, setShowTour] = useState(() => {
    if (!isFirstProject) return false
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(`splynt_tour_done_${userId}`)
  })

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

  const handleProjectUpdate = (updates: { name: string; description: string; is_public?: boolean; public_slug?: string | null }) => {
    setProject(p => ({ ...p, ...updates }))
  }

  return (
    <div>
      {/* Sticky momentum bar — always visible below AppNav */}
      <MomentumBar project={project} checkins={checkins} />

      <div className="flex">
        {/* Main content — shrinks when chat panel is open (handled by CSS margin) */}
        <main className="flex-1 min-w-0 px-4 py-8 md:pr-4 transition-all duration-300">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Roadmap */}
            <RoadmapView
              project={project}
              onRoadmapUpdate={handleRoadmapUpdate}
              onProjectUpdate={handleProjectUpdate}
              onShareStats={() => setShowShareModal(true)}
            />

            {/* Momentum Widget */}
            <MomentumWidget project={project} checkins={checkins} />

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

      {showShareModal && (
        <ShareStatsModal
          project={project}
          checkins={checkins}
          profile={profile}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showTour && (
        <AppTour userId={userId} onDone={() => setShowTour(false)} />
      )}
    </div>
  )
}
