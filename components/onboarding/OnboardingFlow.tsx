'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { Input } from '@/app/components/ui/input'
import { Progress } from '@/app/components/ui/progress'
import { Badge } from '@/app/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { OnboardingAnswers } from '@/types'
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { NicknameModal } from '@/app/components/auth/NicknameModal'

const STAGES = [
  'Just an idea',
  'Research phase',
  'Building MVP',
  'Have early users',
  'Post-revenue',
]

const questions = [
  {
    id: 'projectName' as keyof OnboardingAnswers,
    title: "What's your project called?",
    description: "Give your startup a name. You can always change it later, or skip and we'll name it for you.",
    placeholder: 'e.g. Splynt, Notion, Stripe...',
    type: 'input',
    optional: true,
  },
  {
    id: 'idea' as keyof OnboardingAnswers,
    title: 'What are you building?',
    description: 'Describe your product idea in a few sentences. Be specific.',
    placeholder: 'e.g. A mobile app that helps remote teams run async standups without meetings...',
    type: 'textarea',
  },
  {
    id: 'targetAudience' as keyof OnboardingAnswers,
    title: 'Who is your target customer?',
    description: 'Be as specific as possible — the more focused, the better your roadmap.',
    placeholder: 'e.g. Engineering managers at SaaS companies with 10-50 person remote teams...',
    type: 'textarea',
  },
  {
    id: 'problem' as keyof OnboardingAnswers,
    title: "What problem are you solving?",
    description: 'What specific pain point does your customer feel today?',
    placeholder: 'e.g. Daily standups waste 30 min/person but skipping them kills team visibility...',
    type: 'textarea',
  },
  {
    id: 'solution' as keyof OnboardingAnswers,
    title: 'How does your product solve it?',
    description: 'What makes your approach unique or better than alternatives?',
    placeholder: 'e.g. AI-generated async summaries from Slack threads, no new app needed...',
    type: 'textarea',
  },
  {
    id: 'stage' as keyof OnboardingAnswers,
    title: "Where are you today?",
    description: "What stage is your startup at right now?",
    type: 'select',
    options: STAGES,
  },
  {
    id: 'timeline' as keyof OnboardingAnswers,
    title: 'What is your launch timeline?',
    description: 'When do you want to have your MVP live with real users?',
    placeholder: 'e.g. 3 months, by end of Q3, as soon as possible...',
    type: 'input',
  },
  {
    id: 'biggestChallenge' as keyof OnboardingAnswers,
    title: "What's your biggest challenge right now?",
    description: "What's the one thing keeping you from moving faster?",
    placeholder: 'e.g. Not sure who my first users should be, or how to validate before building...',
    type: 'textarea',
  },
]

const EMPTY_ANSWERS: OnboardingAnswers = {
  projectName: '',
  idea: '',
  targetAudience: '',
  problem: '',
  solution: '',
  stage: '',
  timeline: '',
  biggestChallenge: '',
}

interface OnboardingFlowProps {
  hasNickname?: boolean
  firstName?: string | null
}

export function OnboardingFlow({ hasNickname = true, firstName }: OnboardingFlowProps) {
  const router = useRouter()
  const [nicknameSet, setNicknameSet] = useState(hasNickname)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ANSWERS)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = questions[step]
  const progress = ((step + 1) / questions.length) * 100
  const currentValue = answers[current.id] ?? ''
  const isOptional = (current as { optional?: boolean }).optional ?? false
  const isValid = currentValue.trim().length > 0 || isOptional

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      handleGenerate()
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate roadmap')
      }

      router.push(`/roadmap/${data.projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  if (!nicknameSet) {
    return <NicknameModal firstName={firstName} onDone={() => setNicknameSet(true)} />
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Generating your roadmap...</h2>
        <p className="text-muted-foreground">Gemini is analyzing your idea and building a personalized plan.</p>
        <Loader2 className="mt-8 h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Question {step + 1} of {questions.length}</span>
          <Badge variant="secondary">{Math.round(progress)}% complete</Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-border/60 bg-card p-8">
        <h2 className="mb-2 text-2xl font-bold">{current.title}</h2>
        <p className="mb-6 text-muted-foreground">{current.description}</p>

        {current.type === 'textarea' && (
          <Textarea
            placeholder={current.placeholder}
            value={currentValue}
            onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
            className="min-h-32 resize-none text-base"
            autoFocus
          />
        )}

        {current.type === 'input' && (
          <Input
            placeholder={current.placeholder}
            value={currentValue}
            onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
            className="h-12 text-base"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && isValid && handleNext()}
          />
        )}

        {current.type === 'select' && current.options && (
          <div className="grid gap-2">
            {current.options.map((option) => (
              <button
                key={option}
                onClick={() => setAnswers({ ...answers, [current.id]: option })}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${currentValue === option
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {isOptional && (
            <Button
              variant="ghost"
              onClick={() => {
                setAnswers(a => ({ ...a, [current.id]: '' }))
                handleNext()
              }}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          )}
          <Button onClick={handleNext} disabled={!isValid} className="gap-2">
            {step === questions.length - 1 ? (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Roadmap
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
