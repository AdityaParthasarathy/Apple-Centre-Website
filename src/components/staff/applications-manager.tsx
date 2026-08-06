'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MotionButton } from '@/components/patterns/motion-link'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/ui/select'
import type { ApplicationStatus, SheetApplication } from '@/lib/sheet-types'

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
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)))
    setError(null)
    try {
      const res = await fetch(`/api/staff/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setApplications(previous)
      setError('Failed to update status. Please try again.')
    }
  }

  const handleDelete = async (app: SheetApplication) => {
    if (!confirm(`Delete ${app.name || 'this application'}? This can't be undone.`)) return
    const previous = applications
    setApplications((prev) => prev.filter((a) => a.id !== app.id))
    setError(null)
    try {
      const res = await fetch(`/api/staff/applications/${app.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Failed to delete the application.')
    } catch (err) {
      setApplications(previous)
      setError(err instanceof Error ? err.message : 'Failed to delete the application.')
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
      {applications.map((app) => (
        <Card key={app.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
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
            <MotionButton variant="outline" size="icon-sm" onClick={() => handleDelete(app)} aria-label="Delete application">
              <Trash2 className="h-3.5 w-3.5" />
            </MotionButton>
          </div>
        </Card>
      ))}
    </div>
  )
}
