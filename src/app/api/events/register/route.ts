import { after, NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { escapeHtml, sendMail } from '@/lib/mailer'
import { findEventBySlug } from '@/lib/merge-events'
import { isRegistrationOpen, REGISTRATION_YEARS } from '@/lib/event-registration'
import type { SheetRegistration } from '@/lib/sheet-types'

// Google Apps Script takes 3-45s to answer (see lib/apps-script.ts), and
// Vercel cuts a function off at its plan default (often 10s) unless the route
// says otherwise — which made photo uploads and saves fail with a bare
// platform error. 60s is the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface RegisterResult {
  alreadyRegistered: boolean
  registration: SheetRegistration
  spotsLeft: number | null
}

/** Public endpoint — anyone can register for a published event, no login.
 *  Body: { eventId, name, email, phone?, college?, year?, website? }
 *  `website` is a honeypot: real people never see or fill it. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const text = (key: string, max: number) => String(body[key] ?? '').trim().slice(0, max)
  const name = text('name', 100)
  const email = text('email', 200)
  const phone = text('phone', 30)
  const college = text('college', 150)
  const year = text('year', 30)
  const eventId = text('eventId', 200)

  // Bots that fill every field get a convincing success and nothing is saved.
  if (text('website', 200)) {
    return NextResponse.json({ success: true, alreadyRegistered: false, spotsLeft: null, emailed: true })
  }

  if (!eventId || !name || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Please enter your name and a valid email address.' }, { status: 400 })
  }
  if (year && !REGISTRATION_YEARS.includes(year)) {
    return NextResponse.json({ error: 'Please choose a year from the list.' }, { status: 400 })
  }

  // Looked up here, not trusted from the browser: only a published event can
  // be registered for, and its real capacity and date decide the rules.
  const event = await findEventBySlug(eventId)
  if (!event) {
    return NextResponse.json({ error: 'That event could not be found.' }, { status: 404 })
  }
  if (!isRegistrationOpen(event)) {
    return NextResponse.json({ error: 'Registration for this event has closed.' }, { status: 410 })
  }

  let result: RegisterResult
  try {
    result = await callAppsScript<RegisterResult & Record<string, unknown>>('registerForEvent', {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date.toISOString().slice(0, 10),
      capacity: event.capacity ?? 0,
      name,
      email,
      phone,
      college,
      year,
    })
  } catch (error) {
    if (error instanceof Error && /event is full/i.test(error.message)) {
      return NextResponse.json({ error: 'Sorry, this event is now full.', full: true }, { status: 409 })
    }
    console.error('Failed to register for event:', error)
    return NextResponse.json(
      { error: "We couldn't complete your registration. Please try again in a moment." },
      { status: 502 }
    )
  }

  // The registration is already saved by this point, so the student doesn't
  // wait on the mail server (1-4s) to be told so: the email goes out after the
  // response is sent, and if it fails that is only logged — the seat is theirs
  // either way.
  after(async () => {
    try {
      await sendConfirmation(event, { name, email })
    } catch (error) {
      console.error('Failed to send registration confirmation:', error)
    }
  })

  return NextResponse.json({
    success: true,
    alreadyRegistered: result.alreadyRegistered,
    spotsLeft: result.spotsLeft,
    emailed: true,
  })
}

async function sendConfirmation(
  event: NonNullable<Awaited<ReturnType<typeof findEventBySlug>>>,
  student: { name: string; email: string }
) {
  const date = event.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

  await sendMail({
    to: student.email,
    // Replies go to the Centre, so "I can't make it" reaches a person.
    replyTo: process.env.NOTIFY_EMAIL_TO,
    subject: `You're registered: ${event.title}`,
    html: `
      <p>Hi ${escapeHtml(student.name)},</p>
      <p>You're registered for <strong>${escapeHtml(event.title)}</strong> at the Centre for Apple Technologies.</p>
      <p>
        <strong>Date:</strong> ${escapeHtml(date)}<br />
        <strong>Time:</strong> ${escapeHtml(event.time)}<br />
        <strong>Location:</strong> ${escapeHtml(event.location)}
      </p>
      <p>If you can no longer make it, just reply to this email so we can free up your seat.</p>
      <p>See you there!<br />Centre for Apple Technologies, RIT</p>
    `,
  })
}
