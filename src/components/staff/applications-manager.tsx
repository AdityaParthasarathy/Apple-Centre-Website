'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ExternalLink, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/staff/confirm-dialog'
import { applicationProjects, type ApplicationStatus, type SheetApplication } from '@/lib/sheet-types'

const STATUSES: ApplicationStatus[] = ['Pending', 'Reviewed', 'Accepted', 'Rejected']

const STATUS_BADGE: Record<ApplicationStatus, 'muted' | 'secondary' | 'accent' | 'destructive'> = {
  Pending: 'muted',
  Reviewed: 'secondary',
  Accepted: 'accent',
  Rejected: 'destructive',
}

export function ApplicationsManager({ initialApplications }: { initialApplications: SheetApplication[] }) {
  const [applications, setApplications] = useState(initialApplications)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const previous = applications
    const app = applications.find((a) => a.id === id)
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    setError(null)
    try {
      const res = await fetch(`/api/staff/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, name: app?.name, email: app?.email }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Marked as ${status}`)
    } catch {
      setApplications(previous)
      setError('Failed to update status. Please try again.')
      toast.error('Failed to update status. Please try again.')
    }
  }

  const [pendingDelete, setPendingDelete] = useState<SheetApplication | null>(null)

  const confirmDelete = async () => {
    const app = pendingDelete
    setPendingDelete(null)
    if (!app) return
    const previous = applications
    setApplications((prev) => prev.filter((a) => a.id !== app.id))
    setError(null)
    try {
      const res = await fetch(`/api/staff/applications/${app.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the application.')
      toast.success('Application deleted')
    } catch (err) {
      setApplications(previous)
      const message = err instanceof Error ? err.message : 'Failed to delete the application.'
      setError(message)
      toast.error(message)
    }
  }

  if (applications.length === 0) {
    return <p className="text-sm text-muted-foreground">No applications yet.</p>
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {applications.map((app) => {
        const projects = applicationProjects(app)
        return (
          <Card key={app.id} className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{app.name}</p>
                  <Badge variant={STATUS_BADGE[app.status]} className="text-xs">
                    {app.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {app.email} · {app.phone || 'No phone'} · {app.year}
                </p>
                {app.skills && <p className="mt-1 text-xs text-muted-foreground">Skills: {app.skills}</p>}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Select value={app.status} onValueChange={(value) => updateStatus(app.id, value as ApplicationStatus)}>
                  <SelectTrigger className="w-40 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <MotionButton variant="outline" size="icon-sm" className="size-11" onClick={() => setPendingDelete(app)} aria-label="Delete application">
                  <Trash2 className="h-3.5 w-3.5" />
                </MotionButton>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, idx) => (
                  <div key={idx} className="flex gap-3 rounded-lg border border-border p-3">
                    {project.screenshot && (
                      <a
                        href={project.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border"
                      >
                        <Image src={project.screenshot} alt="" fill className="object-cover" unoptimized />
                      </a>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-3 text-xs text-foreground">{project.description}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {project.sourceLink && (
                          <a
                            href={project.sourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-xs text-accent hover:underline"
                          >
                            Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {project.liveLink && (
                          <a
                            href={project.liveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-xs text-accent hover:underline"
                          >
                            Live <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name || 'this application'}?`}
        description="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
