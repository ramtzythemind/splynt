'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Project } from '@/types'
import { Settings, Loader2, Trash2, AlertTriangle, X, Check, Globe, Copy, ExternalLink } from 'lucide-react'

interface Props {
  project: Project
  onUpdate: (updates: { name: string; description: string; is_public?: boolean; public_slug?: string | null }) => void
}

export function ProjectSettings({ project, onUpdate }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Edit fields
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Build in public
  const [isPublic, setIsPublic] = useState(project.is_public ?? false)
  const [publicSlug, setPublicSlug] = useState(
    project.public_slug ?? project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  )
  const [slugCopied, setSlugCopied] = useState(false)

  // Delete flow
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isDirty =
    name !== project.name ||
    description !== (project.description ?? '') ||
    isPublic !== (project.is_public ?? false) ||
    publicSlug !== (project.public_slug ?? '')
  const canDelete = deleteConfirm === project.name

  const buildPageUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://splynt.app'}/build/${publicSlug}`

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          is_public: isPublic,
          public_slug: isPublic ? publicSlug.trim() : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onUpdate({ name: name.trim(), description: description.trim(), is_public: isPublic, public_slug: isPublic ? publicSlug.trim() : null })
      setOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const copyBuildLink = async () => {
    await navigator.clipboard.writeText(buildPageUrl)
    setSlugCopied(true)
    setTimeout(() => setSlugCopied(false), 2000)
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

              <Separator />

              {/* Build in Public */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">Build in Public</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Share your progress with the world</p>
                  </div>
                  <button
                    onClick={() => setIsPublic((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isPublic ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isPublic && (
                  <div className="space-y-2">
                    <Label htmlFor="public-slug" className="text-xs text-muted-foreground">
                      Your page URL
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">splynt.app/build/</span>
                      <Input
                        id="public-slug"
                        value={publicSlug}
                        onChange={(e) =>
                          setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        }
                        className="h-8 text-xs font-mono"
                        placeholder="my-startup"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyBuildLink}
                        className="flex-1 gap-1.5 h-8 text-xs"
                      >
                        {slugCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {slugCopied ? 'Copied!' : 'Copy link'}
                      </Button>
                      <a
                        href={buildPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 h-8 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Preview
                      </a>
                    </div>
                  </div>
                )}
              </div>

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
