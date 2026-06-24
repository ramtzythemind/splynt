import { createClient } from '@/lib/supabase/server'
import { generateRoadmap } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await request.json()

    const { data: project } = await supabase
      .from('projects')
      .select('onboarding_answers')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const roadmap = await generateRoadmap(project.onboarding_answers)

    await supabase.from('projects').update({ roadmap }).eq('id', projectId)

    return NextResponse.json({ roadmap })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
