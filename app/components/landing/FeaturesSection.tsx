import { Target, CheckCircle2, Brain, Rocket, TrendingUp, Shield } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Roadmaps',
    description: 'Gemini 2.0 Flash analyzes your startup context and generates a customized roadmap — not a generic template.',
  },
  {
    icon: Target,
    title: 'Milestone Tracking',
    description: 'Break your journey into clear phases: Validation, Build, Launch, Growth. Know exactly where you are.',
  },
  {
    icon: CheckCircle2,
    title: 'Task Management',
    description: 'Each milestone comes with prioritized tasks. High, medium, low — so you always know what to tackle first.',
  },
  {
    icon: Rocket,
    title: 'Launch-Focused',
    description: 'Every feature is designed to get you to launch faster. Less planning paralysis, more shipping.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Visualization',
    description: 'See your momentum build with clear progress indicators across milestones and tasks.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your startup idea stays yours. Built on Supabase with row-level security from day one.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Everything a founder needs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">
            Built specifically for early-stage founders who need structure, not complexity.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-lg">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
