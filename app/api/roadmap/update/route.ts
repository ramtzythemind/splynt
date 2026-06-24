import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { RoadmapMilestone } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, roadmap }: { projectId: string; roadmap: RoadmapMilestone[] } = await request.json()

    const { error } = await supabase
      .from('projects')
      .update({ roadmap })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
