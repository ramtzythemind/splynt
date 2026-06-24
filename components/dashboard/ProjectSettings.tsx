'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Project } from '@/types'
import { Settings, Loader2, Trash2, AlertTriangle, X, Check } from 'lucide-react'

interface Props {
  project: Project
  onUpdate: (updates: { name: string; description: string }) => void
}

export function ProjectSettings({ project, onUpdate }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Edit fields
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete flow
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isDirty = name !== project.name || description !== (project.description ?? '')
  const canDelete = deleteConfirm === project.name

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onUpdate({ name: name.trim(), description: description.trim() })
      setOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="Project settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div>
                <h2 className="font-semibold text-lg">Project Settings</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Edit details or delete this project</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="My Startup"
                  onKeyDown={e => e.key === 'Enter' && isDirty && handleSave()}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="project-desc">Description</Label>
                <Input
                  id="project-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What are you building?"
                />
              </div>

              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}

              <Button
                onClick={handleSave}
                disabled={saving || !name.trim() || !isDirty}
                className="w-full gap-2"
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  : <><Check className="h-4 w-4" /> Save changes</>
                }
              </Button>

              <Separator />

              {/* Danger zone */}
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-semibold">Danger Zone</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Permanently deletes this project, all milestones, tasks, check-ins, and chat history. This cannot be undone.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-xs text-muted-foreground">
                    Type <span className="font-mono font-semibold text-foreground">{project.name}</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder={project.name}
                    className="border-destructive/40 focus-visible:ring-destructive/30"
                  />
                </div>
                {deleteError && (
                  <p className="text-xs text-destructive">{deleteError}</p>
                )}
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="w-full gap-2"
                >
                  {deleting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                    : <><Trash2 className="h-4 w-4" /> Delete project</>
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
