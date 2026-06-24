import { createClient } from '@/lib/supabase/server'
import { generateRoadmap } from '@/lib/gemini'
import { NextResponse } from 'next/server'
import type { OnboardingAnswers } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const answers: OnboardingAnswers = body.answers

    const roadmap = await generateRoadmap(answers)

    const ideaTitle = answers.idea.split(' ').slice(0, 5).join(' ')
    const projectName = ideaTitle.length > 3 ? ideaTitle : 'My Startup'

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: projectName,
        description: answers.idea,
        onboarding_answers: answers,
        roadmap,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ projectId: project.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Roadmap generation error:', message)

    if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
