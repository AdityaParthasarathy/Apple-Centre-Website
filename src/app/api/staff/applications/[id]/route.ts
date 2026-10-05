import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { escapeHtml, sendMail } from '@/lib/mailer'
import { failureResponse } from '@/lib/api-errors'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

const VALID_STATUSES = ['Pending', 'Reviewed', 'Accepted', 'Rejected']

const DECISION_EMAIL: Record<string, { subject: string; html: (name: string) => string }> = {
  Accepted: {
    subject: 'Your Apple Centre application — you\'re in!',
    html: (name) => `
      <p>Hi ${name},</p>
      <p>Congratulations — you've been accepted into the Centre for Apple Technologies! We were glad to see what you've been building, and we're looking forward to having you join us.</p>
      <p>Our team will be in touch shortly with next steps.</p>
    `,
  },
  Rejected: {
    subject: 'Your Apple Centre application',
    html: (name) => `
      <p>Hi ${name},</p>
      <p>Thank you for applying to the Centre for Apple Technologies. After reviewing your application, we won't be moving forward this round — but we'd genuinely encourage you to apply again for a future cohort.</p>
      <p>Thanks again for your interest and the work you shared with us.</p>
    `,
  },
}

// Failing to notify the applicant shouldn't block the status change itself
// (the faculty member's action already succeeded on the data that matters) —
// log it and let the request still report success, but say that the email
// didn't go so the portal can tell the faculty member to let them know.
async function sendDecisionEmail(status: string, name?: string, email?: string): Promise<'sent' | 'failed' | 'none'> {
  const template = DECISION_EMAIL[status]
  if (!template) return 'none'
  if (!email) return 'failed'
  try {
    await sendMail({
      to: email,
      // A reply goes to the Centre, not into the sending account's void.
      replyTo: process.env.NOTIFY_EMAIL_TO,
      subject: template.subject,
      html: template.html(escapeHtml(name || 'there')),
    })
    return 'sent'
  } catch (error) {
    console.error('Failed to send decision email:', error)
    return 'failed'
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'A valid status is required.' }, { status: 400 })
  }

  try {
    const result = await callAppsScript('updateApplicationStatus', { id, status: body.status })
    const emailed = await sendDecisionEmail(body.status, body.name, body.email)
    return NextResponse.json({ ...result, emailed })
  } catch (error) {
    console.error('Failed to update application status:', error)
    return failureResponse(error, 'Failed to update the application.')
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFacultySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const result = await callAppsScript('deleteApplication', { id })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete application:', error)
    return failureResponse(error, 'Failed to delete the application.')
  }
}
