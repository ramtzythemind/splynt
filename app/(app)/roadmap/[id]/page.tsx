import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppNav } from '@/app/components/dashboard/AppNav'
import { RoadmapClientView } from '@/app/components/dashboard/RoadmapClientView'
import type { Profile } from '@/types'

export default async function RoadmapPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: project }, { data: profile }, { data: checkins }, { data: chatMessages }, { count: projectCount }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('checkins').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('chat_messages').select('*').eq('project_id', params.id).order('created_at', { ascending: true }).limit(50),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  if (!project) notFound()

  return (
    <div className="min-h-screen bg-muted/20">
      <AppNav user={user} profile={profile as Profile | null} />
      <RoadmapClientView
        project={project}
        recentCheckins={checkins ?? []}
        initialChatMessages={chatMessages ?? []}
        isFirstProject={(projectCount ?? 0) === 1}
        userId={user.id}
        profile={profile as Profile | null}
      />
    </div>
  )
}
