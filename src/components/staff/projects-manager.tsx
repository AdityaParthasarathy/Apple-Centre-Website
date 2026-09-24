'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { ImageUploadField } from '@/components/staff/image-upload-field'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { tempId, useLatest, useOptimisticList } from '@/hooks/use-optimistic-list'
import { inputClass } from '@/lib/utils'
import type { SheetProject } from '@/lib/sheet-types'

const EMPTY_FORM = {
  title: '',
  description: '',
  team: '',
  technologies: '',
  image: '',
  link: '',
  featured: false,
}
type FormState = typeof EMPTY_FORM

export function ProjectsManager({ initialProjects }: { initialProjects: SheetProject[] }) {
  const list = useOptimisticList<SheetProject>(initialProjects, {
    endpoint: '/api/staff/projects',
    itemKey: 'project',
    noun: 'project',
    addAt: 'end',
  })
  const projects = list.items
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useLatest(form)

  const startEdit = (project: SheetProject) => {
    setEditingId(project.id)
    setForm({
      title: project.title,
      description: project.description,
      team: project.team ?? '',
      technologies: project.technologies ?? '',
      image: project.image ?? '',
      link: project.link ?? '',
      featured: !!project.featured,
    })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  // A save that Google ends up refusing hands the form its typing back —
  // unless they have already started on something else in the meantime.
  const restoreForm = (snapshot: FormState, editing: string | null, message: string) => {
    if (JSON.stringify(formRef.current) === JSON.stringify(EMPTY_FORM)) {
      setForm(snapshot)
      setEditingId(editing)
    }
    setError(message)
    toast.error(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form }
    const snapshot = form
    const editing = editingId
    // The form clears and the list changes at once; the save finishes behind it.
    cancelEdit()

    if (editing) {
      const previous = projects.find((x) => x.id === editing)
      const result = await list.update(editing, payload, { ...previous, ...payload, id: editing } as SheetProject)
      if (result.ok) toast.success('Project updated')
      else restoreForm(snapshot, editing, result.message)
    } else {
      const result = await list.add(payload, { ...payload, id: tempId(), createdAt: new Date().toISOString() } as SheetProject)
      if (result.ok) toast.success('Project added')
      else restoreForm(snapshot, null, result.message)
    }
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const confirmDelete = async () => {
    const id = pendingDeleteId
    setPendingDeleteId(null)
    if (!id) return
    if (editingId === id) cancelEdit()
    const result = await list.remove(id)
    if (result.ok) {
      toast.success('Project deleted')
    } else {
      setError(result.message)
      toast.error(result.message)
    }
  }

  const sorted = [...projects].sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1))

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{editingId ? 'Edit project' : 'Add a project'}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectTitle" className="mb-1.5 block text-sm font-medium text-foreground">
              Title
            </label>
            <input
              id="projectTitle"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className="mb-1.5 block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="projectDescription"
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="projectTeam" className="mb-1.5 block text-sm font-medium text-foreground">
                Team (comma-separated)
              </label>
              <input
                id="projectTeam"
                placeholder="Ada Lovelace, Alan Turing"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="projectTechnologies" className="mb-1.5 block text-sm font-medium text-foreground">
                Technologies (comma-separated)
              </label>
              <input
                id="projectTechnologies"
                placeholder="Swift, SwiftUI, CoreML"
                value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField required value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
            <div>
              <label htmlFor="projectLink" className="mb-1.5 block text-sm font-medium text-foreground">
                Link (optional)
              </label>
              <input
                id="projectLink"
                placeholder="https://…"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Featured (shows first)
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <MotionButton type="submit" size="lg">
            {editingId ? 'Save changes' : 'Add project'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet — add one using the form above.</p>
        )}
        {sorted.map((project) => {
          const saving = list.pending.has(project.id)
          return (
          <Card key={project.id} className={`flex items-start justify-between gap-4 p-4 ${saving ? 'opacity-70' : ''}`} aria-busy={saving}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{project.title}</p>
                {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
                {project.featured && <Badge variant="accent" className="text-xs">Featured</Badge>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => startEdit(project)}
                disabled={saving}
                aria-label={`Edit "${project.title}"`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton
                variant="outline"
                size="icon-sm"
                className="size-11"
                onClick={() => setPendingDeleteId(project.id)}
                disabled={saving}
                aria-label={`Delete "${project.title}"`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this project?"
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
