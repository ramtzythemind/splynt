'use client'

import { useState } from 'react'
import { Progress } from '@/app/components/ui/progress'
import { Button } from '@/app/components/ui/button'
import type { IdeaValidation, Project } from '@/types'
import { Sparkles, TrendingUp, Zap, Users, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const scoreColor = (score: number) =>
  score >= 8 ? 'text-green-600' : score >= 6 ? 'text-yellow-600' : 'text-red-500'

const scoreLabel = (score: number) =>
  score >= 8 ? 'Strong' : score >= 6 ? 'Moderate' : 'Weak'

interface Props {
  project: Project
  onUpdate: (validation: IdeaValidation) => void
}

export function IdeaValidator({ project, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(!!project.idea_validation)
  const v = project.idea_validation

  const handleValidate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/validate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, answers: project.onboarding_answers }),
      })
      const data = await res.json()
      if (res.ok) {
        onUpdate(data.validation)
        setExpanded(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Idea Validation</p>
            <p className="text-xs text-muted-foreground">
              {v ? `Overall score: ${v.overallScore}/10` : 'AI-powered market analysis'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {v && (
            <span className={`text-lg font-bold ${scoreColor(v.overallScore)}`}>
              {v.overallScore}/10
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-5 pb-5 pt-4">
          {!v ? (
            <div className="flex flex-col items-center py-6 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Get an AI analysis of your market, feasibility, and competition.
              </p>
              <Button onClick={handleValidate} disabled={loading} className="mt-3 gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Analyzing...' : 'Analyze my idea'}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Score bars */}
              <div className="space-y-3">
                {[
                  { label: 'Market', icon: TrendingUp, data: v.market },
                  { label: 'Feasibility', icon: Zap, data: v.feasibility },
                  { label: 'Competition', icon: Users, data: v.competition },
                ].map(({ label, icon: Icon, data }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {label}
                      </div>
                      <span className={`text-sm font-bold ${scoreColor(data.score)}`}>
                        {data.score}/10 · {scoreLabel(data.score)}
                      </span>
                    </div>
                    <Progress value={data.score * 10} className="h-1.5 mb-1" />
                    <p className="text-xs text-muted-foreground">{data.summary}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3">
                  <p className="mb-2 text-xs font-semibold text-green-700 dark:text-green-400">Strengths</p>
                  <ul className="space-y-1">
                    {v.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                  <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Risks
                  </p>
                  <ul className="space-y-1">
                    {v.risks.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-red-500 mt-0.5">!</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                <p className="mb-1 text-xs font-semibold text-primary">AI Recommendation</p>
                <p className="text-xs text-muted-foreground">{v.recommendation}</p>
              </div>

              <Button variant="outline" size="sm" onClick={handleValidate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Re-analyze
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
