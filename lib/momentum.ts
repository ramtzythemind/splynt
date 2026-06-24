import type { CheckIn, Project } from '@/types'
import { Flame, Zap, Leaf, Rocket } from 'lucide-react'

export function computeStreak(checkins: CheckIn[]): number {
  if (!checkins.length) return 0
  const ONE_DAY = 86400000
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = new Set(
    checkins.map((c) => {
      const d = new Date(c.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )
  let streak = 0
  let cursor = today.getTime()
  if (!days.has(cursor)) cursor -= ONE_DAY
  while (days.has(cursor)) { streak++; cursor -= ONE_DAY }
  return streak
}

export function computeMomentumScore(project: Project, checkins: CheckIn[]): number {
  const streak = computeStreak(checkins)
  const streakPts = Math.min(streak * 4, 40)
  const allTasks = project.roadmap.flatMap((m) => m.tasks ?? [])
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length
  const velocityPts = allTasks.length ? Math.round((completedTasks / allTasks.length) * 30) : 0
  const recentCount = checkins.filter((c) => new Date(c.created_at).getTime() > Date.now() - 7 * 86400000).length
  const activityPts = Math.min(recentCount * 6, 30)
  return Math.min(streakPts + velocityPts + activityPts, 100)
}

export type Tier = {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  textColor: string
  bgColor: string
  ringColor: string
}

export function getTier(score: number): Tier {
  if (score >= 75) return { label: 'Unstoppable', Icon: Rocket, textColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10', ringColor: 'text-purple-500' }
  if (score >= 50) return { label: 'On Fire',       Icon: Flame,  textColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10', ringColor: 'text-orange-500' }
  if (score >= 25) return { label: 'Building Momentum', Icon: Zap, textColor: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10', ringColor: 'text-yellow-500' }
  return           { label: 'Getting Started', Icon: Leaf,  textColor: 'text-green-600 dark:text-green-400',  bgColor: 'bg-green-500/10',  ringColor: 'text-green-500' }
}
