'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { Badge } from '@/app/components/ui/badge'
import type { CheckIn, Project } from '@/types'
import { CalendarCheck, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'

interface Props {
  project: Project
  recentCheckins: CheckIn[]
  onCheckinAdded: (checkin: CheckIn) => void
}

const QUESTIONS = [
  { id: 'progress', label: 'What did you make progress on today?', placeholder: 'e.g. Finished the auth flow, had 2 user calls...' },
  { id: 'blockers', label: 'Any blockers or challenges?', placeholder: 'e.g. Stuck on the Stripe integration, not sure about pricing...' },
  { id: 'next_steps', label: "What's the plan for tomorrow?", placeholder: 'e.g. Ship the MVP landing page, follow up with 3 leads...' },
]

export function DailyCheckin({ project, recentCheckins, onCheckinAdded }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [answers, setAnswers] = useState({ progress: '', blockers: '', next_steps: '' })
  const [submitting, setSubmitting] = useState(false)

  const todayKey = new Date().toISOString().split('T')[0]
  const checkedInToday = recentCheckins.some(c => c.created_at.startsWith(todayKey))

  const handleSubmit = async () => {
    if (!answers.progress || !answers.blockers || !answers.next_steps) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, ...answers }),
      })
      const data = await res.json()
      if (res.ok) {
        onCheckinAdded(data.checkin)
        setFormOpen(false)
        setAnswers({ progress: '', blockers: '', next_steps: '' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden" data-tour="checkin">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
            <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold">Daily Check-in</p>
            <p className="text-xs text-muted-foreground">
              {checkedInToday ? 'Done for today ✓' : `${recentCheckins.length} check-ins so far`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {checkedInToday && <Badge variant="secondary" className="text-xs">Today done</Badge>}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-5 pb-5 pt-4 space-y-4">
          {!formOpen ? (
            <>
              {/* Recent check-ins */}
              {recentCheckins.length > 0 && (
                <div className="space-y-3">
                  {recentCheckins.slice(0, 3).map((checkin) => (
                    <div key={checkin.id} className="rounded-xl border border-border/40 bg-background p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {new Date(checkin.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {checkin.ai_summary ? (
                        <p className="text-sm">{checkin.ai_summary}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2">{checkin.progress}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => setFormOpen(true)}
                disabled={checkedInToday}
                className="w-full gap-2"
                variant={checkedInToday ? 'outline' : 'default'}
              >
                <CalendarCheck className="h-4 w-4" />
                {checkedInToday ? "You've already checked in today" : "Start today's check-in"}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {QUESTIONS.map(({ id, label, placeholder }) => (
                <div key={id} className="space-y-2">
                  <label className="text-sm font-medium">{label}</label>
                  <Textarea
                    placeholder={placeholder}
                    value={answers[id as keyof typeof answers]}
                    onChange={e => setAnswers(a => ({ ...a, [id]: e.target.value }))}
                    className="min-h-20 resize-none text-sm"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !answers.progress || !answers.blockers || !answers.next_steps}
                  className="flex-1 gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {submitting ? 'Saving...' : 'Save check-in'}
                </Button>
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
