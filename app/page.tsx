import Link from 'next/link'
import { Zap, Hammer, Map, Bot, CheckSquare, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'

const features = [
  {
    icon: Map,
    title: 'AI-generated roadmap',
    description: 'Answer a few questions about your idea and get a structured milestone plan tailored to your stage and timeline.',
  },
  {
    icon: Bot,
    title: 'Personal AI advisor',
    description: 'Chat with Splynt AI anytime — it knows your roadmap, your check-ins, and your goals. No generic advice.',
  },
  {
    icon: CheckSquare,
    title: 'Launch checklist',
    description: 'A curated pre-launch checklist covering landing page, payments, analytics, legal, and more.',
  },
  {
    icon: TrendingUp,
    title: 'Daily check-ins',
    description: 'Log your progress, blockers, and next steps every day. Build momentum and track your growth over time.',
  },
]

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              Splynt
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center pt-16">
        {/* Hero */}
        <section className="relative flex w-full flex-col items-center justify-center overflow-hidden px-4 py-32 text-center">
          {/* Background gradient */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/20" />
            <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute right-1/4 top-2/3 h-[400px] w-[400px] rounded-full bg-accent/30 blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-8 gap-1.5 px-3 py-1.5 text-xs font-medium">
              <Hammer className="h-3 w-3 text-primary" />
              Work in progress
            </Badge>

            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your startup,{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                one milestone
              </span>
              <br />
              at a time
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Splynt turns your idea into a structured roadmap with AI-powered milestones, a personal advisor that knows your context, and daily check-ins to keep you on track.
            </p>

            {/* Progress bar */}
            <div className="mx-auto mb-4 w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Build progress</span>
                <span className="font-medium text-foreground">72%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                  style={{ width: '72%' }}
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              We&apos;re building in public — full launch coming soon.
            </p>
          </div>
        </section>

        {/* Blurred dashboard preview */}
        <section className="w-full max-w-5xl px-4 pb-24">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/10">
            {/* Blur overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Hammer className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold">Dashboard preview coming soon</p>
              <p className="text-xs text-muted-foreground">Check back as we ship</p>
            </div>
            {/* Faux chrome */}
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-muted-foreground">splynt.app/dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6 select-none pointer-events-none">
              <div className="col-span-1 space-y-3">
                <div className="h-5 w-24 rounded-md bg-muted" />
                {['Validation', 'Build MVP', 'Launch', 'Growth'].map((phase, i) => (
                  <div
                    key={phase}
                    className={`flex items-center gap-3 rounded-lg p-3 ${i === 1 ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-muted/30'}`}
                  >
                    <div className={`h-2 w-2 rounded-full ${i < 2 ? 'bg-primary' : 'bg-border'}`} />
                    <span className="text-sm font-medium">{phase}</span>
                    {i < 2 && <span className="ml-auto text-xs text-muted-foreground">{i === 0 ? '100%' : '60%'}</span>}
                  </div>
                ))}
              </div>
              <div className="col-span-2 space-y-3">
                <div className="h-5 w-32 rounded-md bg-muted" />
                {[
                  { title: 'User interviews', done: true },
                  { title: 'Define core value prop', done: true },
                  { title: 'Build landing page', done: true },
                  { title: 'Set up auth & DB', done: false },
                  { title: 'Core feature implementation', done: false },
                ].map((task) => (
                  <div key={task.title} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3">
                    <div className={`h-4 w-4 flex-shrink-0 rounded ${task.done ? 'bg-primary' : 'border-2 border-border'}`}>
                      {task.done && <div className="flex h-full w-full items-center justify-center text-white text-[8px]">✓</div>}
                    </div>
                    <span className={`text-sm ${task.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="w-full border-t border-border/60 bg-muted/20 px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything a founder needs
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground text-lg">
                From raw idea to first users — Splynt covers the full journey with tools built specifically for early-stage founders.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
