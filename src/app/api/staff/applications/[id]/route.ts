import { NextResponse } from 'next/server'
import { getFacultySession } from '@/lib/session'
import { callAppsScript } from '@/lib/apps-script'
import { sendMail } from '@/lib/mailer'

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
// (the faculty member's action already succeeded on the data that matters)
// — log it and let the request still report success.
async function sendDecisionEmail(status: string, name?: string, email?: string) {
  const template = DECISION_EMAIL[status]
  if (!template || !email) return
  try {
    await sendMail({ to: email, subject: template.subject, html: template.html(name || 'there') })
  } catch (error) {
    console.error('Failed to send decision email:', error)
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
    await sendDecisionEmail(body.status, body.name, body.email)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update application status:', error)
    return NextResponse.json({ error: 'Failed to update the application.' }, { status: 502 })
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
    return NextResponse.json({ error: 'Failed to delete the application.' }, { status: 502 })
  }
}
