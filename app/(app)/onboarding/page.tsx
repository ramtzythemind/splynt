import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { Zap } from 'lucide-react'
import Link from 'next/link'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase.from('projects').select('id').eq('user_id', user.id).limit(1),
    supabase.from('profiles').select('nickname, first_name').eq('id', user.id).single(),
  ])

  if (projects && projects.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-10 flex flex-col items-center text-center">
          <Link href="/" className="mb-6 flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            Splynt
          </Link>
          <h1 className="text-3xl font-bold">Let&apos;s build your roadmap</h1>
          <p className="mt-2 text-muted-foreground">
            Answer 7 quick questions and we&apos;ll generate a personalized plan for your startup.
          </p>
        </div>

        <OnboardingFlow
          hasNickname={!!profile?.nickname}
          firstName={profile?.first_name}
        />
      </div>
    </div>
  )
}
