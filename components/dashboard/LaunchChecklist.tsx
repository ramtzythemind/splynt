'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/app/components/ui/progress'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import type { LaunchChecklistItem, Project } from '@/types'
import { Rocket, ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface Props {
  project: Project
  onUpdate: (checklist: LaunchChecklistItem[]) => void
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    return { ...acc, [k]: [...(acc[k] ?? []), item] }
  }, {} as Record<string, T[]>)
}

export function LaunchChecklist({ project, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  const checklist = project.launch_checklist ?? []
  const completed = checklist.filter(i => i.status === 'completed').length
  const progress = checklist.length ? Math.round((completed / checklist.length) * 100) : 0
  const grouped = groupBy(checklist, 'category')

  const handleGenerate = async () => {
    setLoading(true)
    const res = await fetch('/api/launch-checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    })
    const data = await res.json()
    if (res.ok) {
      onUpdate(data.checklist)
      setExpanded(true)
    }
    setLoading(false)
  }

  const toggleItem = async (itemId: string) => {
    const updated = checklist.map(item =>
      item.id === itemId
        ? { ...item, status: item.status === 'completed' ? ('pending' as const) : ('completed' as const) }
        : item
    )
    onUpdate(updated)
    const supabase = createClient()
    await supabase.from('projects').update({ launch_checklist: updated }).eq('id', project.id)
  }

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10">
            <Rocket className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold">Launch Checklist</p>
            <p className="text-xs text-muted-foreground">
              {checklist.length ? `${completed}/${checklist.length} done · ${progress}%` : 'Everything needed to ship'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {checklist.length > 0 && (
            <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-xs">
              {progress === 100 ? '🚀 Launch ready' : `${progress}%`}
            </Badge>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-5 pb-5 pt-4">
          {checklist.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <p className="mb-3 text-sm text-muted-foreground">Generate a personalized pre-launch checklist for your product.</p>
              <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Generate Checklist
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4">
                <Progress value={progress} className="h-2" />
                <p className="mt-1 text-right text-xs text-muted-foreground">{completed} of {checklist.length} completed</p>
              </div>

              {Object.entries(grouped).map(([category, items]) => {
                const catDone = items.filter(i => i.status === 'completed').length
                const isOpen = openCategories.has(category)

                return (
                  <div key={category} className="rounded-xl border border-border/40 overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{catDone}/{items.length}</span>
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-border/40 bg-background/50 p-2 space-y-1">
                        {items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-muted/50 transition-colors"
                          >
                            {item.status === 'completed'
                              ? <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              : <Circle className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                            }
                            <div>
                              <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
