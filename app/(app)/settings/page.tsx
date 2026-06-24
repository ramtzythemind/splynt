import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNav } from '@/components/dashboard/AppNav'
import { SettingsForm } from '@/components/settings/SettingsForm'
import type { Profile } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-muted/20">
      <AppNav user={user} profile={profile as Profile | null} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your profile, avatar, and preferences</p>
        </div>
        <SettingsForm user={user} initialProfile={profile as Profile | null} />
      </main>
    </div>
  )
}
