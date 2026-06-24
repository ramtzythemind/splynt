import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/20 px-8 py-16">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl">
            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to build something{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              real?
            </span>
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground text-lg">
            Join founders who are turning their ideas into structured plans and shipping faster.
          </p>

          <Button size="lg" className="h-12 gap-2 px-10 text-base" asChild>
            <Link href="/signup">
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required</p>
        </div>
      </div>
    </section>
  )
}
