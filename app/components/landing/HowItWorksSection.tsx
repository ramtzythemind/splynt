import { MessageSquare, Sparkles, LayoutDashboard } from 'lucide-react'

const steps = [
  {
    icon: MessageSquare,
    step: '01',
    title: 'Answer 7 questions',
    description: 'Tell us about your idea, audience, problem, and where you are today. Takes 3 minutes.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'AI generates your roadmap',
    description: 'Gemini 2.0 Flash analyzes your answers and creates a tailored roadmap with phases, milestones, and prioritized tasks.',
  },
  {
    icon: LayoutDashboard,
    step: '03',
    title: 'Execute with clarity',
    description: 'Track progress, check off tasks, and stay focused on what moves the needle toward your launch.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            From idea to roadmap in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">
            No more blank-page paralysis. Splynt gives you a clear path forward from day one.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-border to-transparent md:block" />
              )}
              <div className="relative rounded-2xl border border-border/60 bg-card p-8 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-4xl font-bold text-muted/30 tabular-nums">{step.step}</span>
                </div>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
