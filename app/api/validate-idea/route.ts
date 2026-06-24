import { createClient } from '@/lib/supabase/server'
import { validateIdea } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, answers } = await request.json()

    const validation = await validateIdea(answers)

    await supabase
      .from('projects')
      .update({ idea_validation: validation })
      .eq('id', projectId)
      .eq('user_id', user.id)

    return NextResponse.json({ validation })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
