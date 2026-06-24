import { createClient } from '@/lib/supabase/server'
import { chatWithAI } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, message, history } = await request.json()

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5)

    const { text, roadmapUpdate } = await chatWithAI({
      project,
      recentCheckins: checkins ?? [],
      messages: history ?? [],
      userMessage: message,
    })

    // Persist both messages
    await supabase.from('chat_messages').insert([
      { user_id: user.id, project_id: projectId, role: 'user', content: message },
      { user_id: user.id, project_id: projectId, role: 'assistant', content: text },
    ])

    // Apply roadmap update if present
    if (roadmapUpdate) {
      await supabase
        .from('projects')
        .update({ roadmap: roadmapUpdate })
        .eq('id', projectId)
    }

    return NextResponse.json({ text, roadmapUpdate })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Chat error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
