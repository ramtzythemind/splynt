import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Project, CheckIn, RoadmapMilestone } from '@/types'
import { Zap, CheckCircle2, Circle, Clock, Flame, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const PHASE_COLORS: Record<string, string> = {
  validation: 'bg-blue-500/10 text-blue-600 border-blue-200',
  build: 'bg-orange-500/10 text-orange-600 border-orange-200',
  launch: 'bg-green-500/10 text-green-600 border-green-200',
  growth: 'bg-purple-500/10 text-purple-600 border-purple-200',
}

function computeStreak(checkins: CheckIn[]): number {
  if (!checkins.length) return 0
  const ONE_DAY = 86400000
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = new Set(checkins.map((c) => { const d = new Date(c.created_at); d.setHours(0,0,0,0); return d.getTime() }))
  let streak = 0
  let cursor = today.getTime()
  if (!days.has(cursor)) cursor -= ONE_DAY
  while (days.has(cursor)) { streak++; cursor -= ONE_DAY }
  return streak
}

function StatusDot({ status }: { status: RoadmapMilestone['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
  if (status === 'in_progress') return <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
  return <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('name, description')
    .eq('public_slug', params.slug)
    .eq('is_public', true)
    .single()

  if (!data) return { title: 'Build Log' }

  const title = `${data.name} — Build Log`
  const description = data.description ?? `Follow ${data.name}'s startup journey on Splynt — milestones, daily check-ins, and real progress.`

  return {
    title,
    description,
    alternates: { canonical: `https://splynt.app/build/${params.slug}` },
    openGraph: {
      title: `${data.name} — Building in Public on Splynt`,
      description,
      url: `https://splynt.app/build/${params.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.name} — Building in Public`,
      description,
    },
  }
}

export default async function BuildPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('public_slug', params.slug)
    .eq('is_public', true)
    .single()

  if (!project) notFound()

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const p = project as Project
  const roadmap = p.roadmap ?? []
  const allCheckins = (checkins ?? []) as CheckIn[]

  const completedMilestones = roadmap.filter((m) => m.status === 'completed').length
  const totalProgress = roadmap.length ? Math.round((completedMilestones / roadmap.length) * 100) : 0
  const streak = computeStreak(allCheckins)
  const currentMilestone = roadmap.find((m) => m.status === 'in_progress') ?? roadmap.find((m) => m.status === 'pending')

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Zap className="h-3 w-3 text-primary-foreground" />
              </div>
              Splynt
            </Link>
            <span className="text-xs text-muted-foreground">Building in Public</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 space-y-10">
        {/* Hero */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {currentMilestone ? `Phase: ${currentMilestone.phase}` : 'Completed'}
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600">
                <Flame className="h-3 w-3" />
                {streak} day streak
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.name}</h1>
          {p.description && (
            <p className="mt-2 text-muted-foreground max-w-2xl">{p.description}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Overall progress', value: `${totalProgress}%` },
            { label: 'Milestones done', value: `${completedMilestones}/${roadmap.length}` },
            { label: 'Check-ins logged', value: allCheckins.length },
            { label: 'Day streak', value: streak },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-card p-4 text-center"
            >
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">Roadmap progress</span>
            <span className="text-muted-foreground">{completedMilestones} of {roadmap.length} milestones</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          <div className="mt-6 space-y-2">
            {roadmap.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <StatusDot status={milestone.status} />
                <span className={`flex-1 text-sm font-medium ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {milestone.title}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs capitalize ${PHASE_COLORS[milestone.phase] ?? ''}`}
                >
                  {milestone.phase}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">{milestone.timeframe}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Check-in feed */}
        {allCheckins.length > 0 && (
          <div>
            <h2 className="mb-4 font-semibold text-lg">Build log</h2>
            <div className="space-y-3">
              {allCheckins.slice(0, 10).map((checkin) => (
                <div
                  key={checkin.id}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      {new Date(checkin.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {checkin.ai_summary ? (
                    <p className="text-sm leading-relaxed">{checkin.ai_summary}</p>
                  ) : (
                    <p className="text-sm leading-relaxed">{checkin.progress}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border/40 pt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
              <Zap className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            Powered by Splynt — Build your startup, one milestone at a time
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </main>
    </div>
  )
}
