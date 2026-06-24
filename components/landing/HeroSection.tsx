import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16 text-center">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/20" />
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-1/4 top-2/3 h-[400px] w-[400px] rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl">
        <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-xs font-medium">
          <Sparkles className="h-3 w-3 text-primary" />
          Powered by Gemini 2.0 Flash
        </Badge>

        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Go from idea to{' '}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            launch
          </span>
          <br />
          with clarity
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Splynt turns your startup idea into a structured roadmap with milestones, tasks, and AI-powered guidance — so you always know what to build next.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="h-12 gap-2 px-8 text-base" asChild>
            <Link href="/signup">
              Start building for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required · Free to start
        </p>
      </div>

      {/* Preview mockup */}
      <div className="mt-16 w-full max-w-5xl px-4">
        <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/10">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-muted-foreground">splynt.app/dashboard</span>
          </div>
          <div className="grid grid-cols-3 gap-4 p-6">
            <div className="col-span-1 space-y-3">
              <div className="h-5 w-24 rounded-md bg-muted" />
              {['Validation', 'Build MVP', 'Launch', 'Growth'].map((phase, i) => (
                <div
                  key={phase}
                  className={`flex items-center gap-3 rounded-lg p-3 ${i === 1 ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}
                >
                  <div className={`h-2 w-2 rounded-full ${i < 2 ? 'bg-primary' : 'bg-border'}`} />
                  <span className="text-sm font-medium">{phase}</span>
                  {i < 2 && <div className="ml-auto text-xs text-muted-foreground">{i === 0 ? '100%' : '60%'}</div>}
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
      </div>
    </section>
  )
}
