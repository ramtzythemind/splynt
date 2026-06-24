export interface OnboardingAnswers {
  projectName?: string
  idea: string
  targetAudience: string
  problem: string
  solution: string
  stage: string
  timeline: string
  biggestChallenge: string
}

export interface RoadmapMilestone {
  id: string
  title: string
  description: string
  phase: 'validation' | 'build' | 'launch' | 'growth'
  timeframe: string
  tasks: RoadmapTask[]
  status: 'pending' | 'in_progress' | 'completed'
}

export interface RoadmapTask {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
}

export interface IdeaValidation {
  overallScore: number
  market: { score: number; summary: string }
  feasibility: { score: number; summary: string }
  competition: { score: number; summary: string }
  strengths: string[]
  risks: string[]
  recommendation: string
}

export interface LaunchChecklistItem {
  id: string
  category: string
  title: string
  description: string
  status: 'pending' | 'completed'
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  onboarding_answers: OnboardingAnswers
  roadmap: RoadmapMilestone[]
  idea_validation: IdeaValidation | null
  launch_checklist: LaunchChecklistItem[]
  is_public: boolean
  public_slug: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  nickname: string | null
  first_name: string | null
  last_name: string | null
  avatar_color: string
  avatar_gradient: string
  avatar_shape: string
  billing_name: string | null
  billing_address: string | null
  billing_city: string | null
  billing_country: string | null
  billing_vat: string | null
  skill_tags: string[]
}

export interface CheckIn {
  id: string
  user_id: string
  project_id: string
  progress: string
  blockers: string
  next_steps: string
  ai_summary: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export const SKILL_TAGS = [
  'Coder', 'Full Stack', 'Designer', 'No-Code',
  'Marketer', 'Founder', 'Tech', 'Product', 'Growth',
] as const

export const AVATAR_GRADIENTS = [
  { label: 'Violet', value: 'from-violet-500 to-indigo-500' },
  { label: 'Ocean', value: 'from-cyan-400 to-blue-600' },
  { label: 'Sunset', value: 'from-orange-400 to-pink-600' },
  { label: 'Forest', value: 'from-emerald-400 to-teal-600' },
  { label: 'Rose', value: 'from-rose-400 to-purple-600' },
  { label: 'Gold', value: 'from-yellow-400 to-orange-500' },
  { label: 'Night', value: 'from-slate-600 to-gray-900' },
  { label: 'Aurora', value: 'from-green-400 to-cyan-500' },
] as const

export const AVATAR_SHAPES = ['circle', 'rounded', 'square'] as const
