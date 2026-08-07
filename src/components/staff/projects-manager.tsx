'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { ImageUploadField } from '@/components/staff/image-upload-field'
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
  const [projects, setProjects] = useState(initialProjects)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = { ...form }

    try {
      if (editingId) {
        const res = await fetch(`/api/staff/projects/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to update the project.')
        setProjects((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload, id: editingId } : p)))
      } else {
        const res = await fetch('/api/staff/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ?? 'Failed to save the project.')
        if (body?.project) setProjects((prev) => [...prev, body.project as SheetProject])
      }
      cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This can't be undone.")) return
    try {
      const res = await fetch(`/api/staff/projects/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the project.')
      setProjects((prev) => prev.filter((p) => p.id !== id))
      if (editingId === id) cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the project.')
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Team (comma-separated)</label>
              <input
                placeholder="Ada Lovelace, Alan Turing"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Technologies (comma-separated)</label>
              <input
                placeholder="Swift, SwiftUI, CoreML"
                value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField label="Photo (optional)" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Link (optional)</label>
              <input placeholder="https://…" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={inputClass} />
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

          <MotionButton
            type="submit"
            size="lg"
            disabled={submitting}
            className="disabled:pointer-events-none disabled:opacity-80"
          >
            {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add project'}
          </MotionButton>
        </form>
      </Card>

      <div className="space-y-3">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
        {sorted.map((project) => (
          <Card key={project.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{project.title}</p>
                {project.featured && <Badge variant="accent" className="text-xs">Featured</Badge>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <MotionButton variant="outline" size="icon-sm" onClick={() => startEdit(project)} aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </MotionButton>
              <MotionButton variant="outline" size="icon-sm" onClick={() => handleDelete(project.id)} aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </MotionButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
