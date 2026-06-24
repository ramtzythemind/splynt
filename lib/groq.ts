import Groq from 'groq-sdk'
import type {
  OnboardingAnswers,
  RoadmapMilestone,
  IdeaValidation,
  CheckIn,
  Project,
  ChatMessage,
} from '@/types'

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

export async function generateRoadmap(answers: OnboardingAnswers): Promise<RoadmapMilestone[]> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: 'You are an expert startup advisor. Return ONLY valid JSON arrays — no markdown, no code fences, no explanation.',
      },
      {
        role: 'user',
        content: `Generate a detailed product roadmap for this startup.

Idea: ${answers.idea}
Target Audience: ${answers.targetAudience}
Problem: ${answers.problem}
Solution: ${answers.solution}
Stage: ${answers.stage}
Timeline: ${answers.timeline}
Biggest Challenge: ${answers.biggestChallenge}

Return a JSON array of 4-6 milestones. Structure:
[{
  "id": "kebab-id",
  "title": "string",
  "description": "string",
  "phase": "validation"|"build"|"launch"|"growth",
  "timeframe": "e.g. Week 1-2",
  "status": "pending",
  "tasks": [{
    "id": "kebab-id",
    "title": "string",
    "description": "string",
    "priority": "high"|"medium"|"low",
    "status": "pending"
  }]
}]
3-5 tasks per milestone. Return ONLY the JSON array.`,
      },
    ],
  })

  const text = res.choices[0]?.message?.content ?? ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Failed to parse roadmap from AI response')
  return JSON.parse(match[0]) as RoadmapMilestone[]
}

export async function validateIdea(answers: OnboardingAnswers): Promise<IdeaValidation> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: 'You are a startup analyst. Return ONLY valid JSON — no markdown, no code fences.',
      },
      {
        role: 'user',
        content: `Analyze this startup idea and return a validation report as JSON.

Idea: ${answers.idea}
Target Audience: ${answers.targetAudience}
Problem: ${answers.problem}
Solution: ${answers.solution}
Stage: ${answers.stage}

Return this exact JSON structure (scores 1-10):
{
  "overallScore": number,
  "market": { "score": number, "summary": "2-3 sentence analysis" },
  "feasibility": { "score": number, "summary": "2-3 sentence analysis" },
  "competition": { "score": number, "summary": "2-3 sentence analysis" },
  "strengths": ["string", "string", "string"],
  "risks": ["string", "string", "string"],
  "recommendation": "2-3 sentence overall recommendation"
}`,
      },
    ],
  })

  const text = res.choices[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Failed to parse validation from AI')
  return JSON.parse(match[0]) as IdeaValidation
}

export async function generateCheckinSummary(checkin: Omit<CheckIn, 'id' | 'user_id' | 'project_id' | 'ai_summary' | 'created_at'>): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Summarize this daily founder check-in in 2-3 sentences. Be encouraging but realistic. Focus on momentum and next action.

Progress today: ${checkin.progress}
Blockers: ${checkin.blockers}
Next steps: ${checkin.next_steps}`,
      },
    ],
  })

  return res.choices[0]?.message?.content ?? ''
}

export async function generateDefaultChecklist(): Promise<import('@/types').LaunchChecklistItem[]> {
  return [
    { id: 'lp-1', category: 'Landing Page', title: 'Create landing page', description: 'Build a compelling page that explains your value prop', status: 'pending' },
    { id: 'lp-2', category: 'Landing Page', title: 'Set up domain & hosting', description: 'Purchase domain and deploy your landing page', status: 'pending' },
    { id: 'lp-3', category: 'Landing Page', title: 'Add waitlist / email capture', description: 'Collect early interest before launch', status: 'pending' },
    { id: 'an-1', category: 'Analytics', title: 'Install analytics (Plausible / GA4)', description: 'Track visitors and conversion from day one', status: 'pending' },
    { id: 'an-2', category: 'Analytics', title: 'Set up error monitoring', description: 'Sentry or similar to catch production bugs', status: 'pending' },
    { id: 'pa-1', category: 'Payments', title: 'Set up Stripe account', description: 'Create and verify your Stripe account', status: 'pending' },
    { id: 'pa-2', category: 'Payments', title: 'Implement payment flow', description: 'Checkout, subscriptions, or one-time payments', status: 'pending' },
    { id: 'pa-3', category: 'Payments', title: 'Test payment with real card', description: 'End-to-end test before going live', status: 'pending' },
    { id: 'so-1', category: 'Social', title: 'Create Twitter/X account', description: 'Build audience before launch', status: 'pending' },
    { id: 'so-2', category: 'Social', title: 'Create LinkedIn page', description: 'Professional presence for B2B trust', status: 'pending' },
    { id: 'so-3', category: 'Social', title: 'Write 10 pre-launch posts', description: 'Build up content ready to publish', status: 'pending' },
    { id: 'le-1', category: 'Legal', title: 'Add Privacy Policy', description: 'Required for GDPR and user trust', status: 'pending' },
    { id: 'le-2', category: 'Legal', title: 'Add Terms of Service', description: 'Protects you and sets user expectations', status: 'pending' },
    { id: 'pr-1', category: 'Product', title: 'Core feature complete', description: 'MVP feature set is working end-to-end', status: 'pending' },
    { id: 'pr-2', category: 'Product', title: 'Mobile responsive', description: 'Works well on phones and tablets', status: 'pending' },
    { id: 'pr-3', category: 'Product', title: 'Onboarding flow tested', description: 'New user can get to value in < 5 min', status: 'pending' },
    { id: 'pr-4', category: 'Product', title: 'Beta tested with 3+ users', description: 'Real feedback before public launch', status: 'pending' },
    { id: 'su-1', category: 'Support', title: 'Set up support email / Intercom', description: 'Way for users to reach you', status: 'pending' },
    { id: 'su-2', category: 'Support', title: 'Write onboarding email sequence', description: '3-email welcome series for new signups', status: 'pending' },
  ]
}

export interface SocialPosts {
  twitter: string
  linkedin: string
  threads: string
}

export async function generateSocialPosts({
  projectName,
  projectDescription,
  milestoneTitle,
  milestonePhase,
  buildPageUrl,
}: {
  projectName: string
  projectDescription: string
  milestoneTitle: string
  milestonePhase: string
  buildPageUrl?: string
}): Promise<SocialPosts> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'You are a copywriter helping startup founders share their wins on social media. Return ONLY valid JSON — no markdown, no code fences.',
      },
      {
        role: 'user',
        content: `Write 3 social media posts celebrating a founder completing a milestone. Be authentic, specific, and in a building-in-public voice. No cringe corporate tone.

Project: ${projectName}
What it does: ${projectDescription}
Milestone completed: ${milestoneTitle}
Phase: ${milestonePhase}
${buildPageUrl ? `Build page: ${buildPageUrl}` : ''}

Return this exact JSON:
{
  "twitter": "Under 240 chars. Punchy and direct. Use #BuildInPublic. Include the milestone win. End with a link placeholder if build page provided.",
  "linkedin": "150–250 words. Professional but personal. Story-driven. What was the challenge, what was achieved, what's next. No bullet spam.",
  "threads": "Casual and conversational. 2-3 short paragraphs. Like texting a friend who's also a founder. Authentic, no hype."
}

Return ONLY the JSON.`,
      },
    ],
  })

  const text = res.choices[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Failed to parse social posts from AI')
  return JSON.parse(match[0]) as SocialPosts
}

interface ChatContext {
  project: Project
  recentCheckins: CheckIn[]
  messages: ChatMessage[]
  userMessage: string
}

export async function chatWithAI(ctx: ChatContext): Promise<{ text: string; roadmapUpdate?: RoadmapMilestone[] }> {
  const completedMilestones = ctx.project.roadmap.filter(m => m.status === 'completed').map(m => m.title)
  const currentMilestone = ctx.project.roadmap.find(m => m.status === 'in_progress' || m.status === 'pending')

  const systemPrompt = `You are Splynt AI, a personal startup advisor embedded in the founder's dashboard.

## Founder's Context
Project: ${ctx.project.name}
Idea: ${ctx.project.description}
Onboarding answers:
- Target audience: ${ctx.project.onboarding_answers?.targetAudience ?? 'N/A'}
- Problem: ${ctx.project.onboarding_answers?.problem ?? 'N/A'}
- Solution: ${ctx.project.onboarding_answers?.solution ?? 'N/A'}
- Stage: ${ctx.project.onboarding_answers?.stage ?? 'N/A'}
- Timeline: ${ctx.project.onboarding_answers?.timeline ?? 'N/A'}

## Roadmap Status
Completed milestones: ${completedMilestones.join(', ') || 'None yet'}
Current focus: ${currentMilestone?.title ?? 'All done!'}
Total milestones: ${ctx.project.roadmap.length}

## Current Roadmap (full JSON — use this as the base when modifying)
${JSON.stringify(ctx.project.roadmap, null, 2)}

## Recent Check-ins
${ctx.recentCheckins.slice(0, 3).map(c => `[${c.created_at?.split('T')[0]}] ${c.ai_summary || `Progress: ${c.progress}. Blockers: ${c.blockers}`}`).join('\n') || 'No check-ins yet'}

## Your Role
- Give concise, actionable advice tailored to THIS founder's specific context
- When asked to update the roadmap, add milestones, or restructure, output an action block
- Be direct, encouraging, and specific. No generic startup advice.

## Roadmap Actions
If the user asks you to modify the roadmap (update, restructure, add milestone, etc.), end your response with an XML action block:
<action type="update_roadmap">
[full roadmap JSON array here]
</action>

If just adding one milestone:
<action type="add_milestone">
{single milestone JSON object}
</action>

Always explain what you changed and why BEFORE the action block. Keep the explanation under 100 words.`

  const historyMessages = ctx.messages.slice(-10).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: ctx.userMessage },
    ],
  })

  const fullText = res.choices[0]?.message?.content ?? ''

  // Parse action blocks
  const actionMatch = fullText.match(/<action type="(update_roadmap|add_milestone)">([\s\S]*?)<\/action>/)
  let roadmapUpdate: RoadmapMilestone[] | undefined

  if (actionMatch) {
    try {
      const actionType = actionMatch[1]
      const actionData = actionMatch[2].trim()

      if (actionType === 'update_roadmap') {
        const match = actionData.match(/\[[\s\S]*\]/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed) && parsed.length > 0) roadmapUpdate = parsed
        }
      } else if (actionType === 'add_milestone') {
        const match = actionData.match(/\{[\s\S]*\}/)
        if (match) {
          const newMilestone = JSON.parse(match[0])
          roadmapUpdate = [...ctx.project.roadmap, newMilestone]
        }
      }
    } catch {
      // JSON parse failed, ignore action
    }
  }

  // Strip action block from displayed text
  const displayText = fullText.replace(/<action[\s\S]*?<\/action>/g, '').trim()

  return { text: displayText, roadmapUpdate }
}
