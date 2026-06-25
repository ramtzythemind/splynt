import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardView } from '@/app/components/dashboard/DashboardView'
import { AppNav } from '@/app/components/dashboard/AppNav'
import type { Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!projects || projects.length === 0) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AppNav user={user} profile={profile as Profile | null} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <DashboardView projects={projects} profile={profile as Profile | null} />
      </main>
    </div>
  )
}
