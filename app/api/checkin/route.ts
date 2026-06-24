import { createClient } from '@/lib/supabase/server'
import { generateCheckinSummary } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, progress, blockers, next_steps } = await request.json()

    const ai_summary = await generateCheckinSummary({ progress, blockers, next_steps })

    const { data: checkin, error } = await supabase
      .from('checkins')
      .insert({ user_id: user.id, project_id: projectId, progress, blockers, next_steps, ai_summary })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ checkin })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
