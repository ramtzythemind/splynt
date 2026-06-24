import { createClient } from '@/lib/supabase/server'
import { generateSocialPosts } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, milestoneId } = await request.json()

    const { data: project } = await supabase
      .from('projects')
      .select('name, description, roadmap, public_slug, is_public')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const milestone = (project.roadmap as { id: string; title: string; phase: string }[])
      ?.find((m) => m.id === milestoneId)

    if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })

    const buildPageUrl =
      project.is_public && project.public_slug
        ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://splynt.app'}/build/${project.public_slug}`
        : undefined

    const posts = await generateSocialPosts({
      projectName: project.name,
      projectDescription: project.description,
      milestoneTitle: milestone.title,
      milestonePhase: milestone.phase,
      buildPageUrl,
    })

    return NextResponse.json({ posts })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
