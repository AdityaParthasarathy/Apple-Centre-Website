import { after, NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { escapeHtml, sendMail } from '@/lib/mailer'
import { getAllPrograms } from '@/lib/merge-programs'
import {
  isValidPhone,
  MISSING_DETAILS_MESSAGE,
  programRegistrationId,
  REGISTRATION_YEARS,
} from '@/lib/event-registration'

// Google's script can take a while to answer (see lib/apps-script.ts); 60s is
// the ceiling that is valid on every Vercel plan.
export const maxDuration = 60

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Public endpoint — anyone can sign up for a program, no login. Just the
 *  basics: { programId, name, email, phone, college, year, website? } (all
 *  required except `website`, a honeypot real people never fill). Nothing about
 *  skills or a résumé: that is only for applying to become a member.
 *
 *  Signups are kept in the same sheet tab as event registrations, under the id
 *  "program:<id>" (see programRegistrationId), so the staff Registrations page
 *  lists them next to the events with no new sheet to set up. */
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
  const programId = text('programId', 200)

  // Bots that fill every field get a convincing success and nothing is saved.
  if (text('website', 200)) {
    return NextResponse.json({ success: true, alreadyRegistered: false, emailed: true })
  }

  if (!programId || !name || !EMAIL_PATTERN.test(email) || !phone || !college || !year) {
    return NextResponse.json({ error: MISSING_DETAILS_MESSAGE }, { status: 400 })
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
  }
  if (!REGISTRATION_YEARS.includes(year)) {
    return NextResponse.json({ error: 'Please choose a year from the list.' }, { status: 400 })
  }

  // Looked up here, not trusted from the browser: only a real program can be signed up for.
  const program = (await getAllPrograms()).find((p) => p.id === programId)
  if (!program) {
    return NextResponse.json({ error: 'That program could not be found.' }, { status: 404 })
  }

  let alreadyRegistered = false
  try {
    const result = await callAppsScript<{ alreadyRegistered?: boolean }>('registerForEvent', {
      eventId: programRegistrationId(program.id),
      eventTitle: program.title,
      eventDate: '',
      capacity: 0,
      name,
      email,
      phone,
      college,
      year,
    })
    alreadyRegistered = !!result.alreadyRegistered
  } catch (error) {
    console.error('Failed to register for program:', error)
    return NextResponse.json(
      { error: "We couldn't complete your registration. Please try again in a moment." },
      { status: 502 }
    )
  }

  // The signup is saved, so the reply doesn't wait on the mail server; the
  // email goes out after it, and a failure is only logged.
  if (!alreadyRegistered) {
    after(async () => {
      try {
        await sendMail({
          to: email,
          // Replies go to the Centre, so a question reaches a person.
          replyTo: process.env.NOTIFY_EMAIL_TO,
          subject: `You're registered: ${program.title}`,
          html: `
            <p>Hi ${escapeHtml(name)},</p>
            <p>You're registered for the <strong>${escapeHtml(program.title)}</strong> program at the Centre for Apple Technologies.</p>
            <p><strong>Duration:</strong> ${escapeHtml(program.duration)}</p>
            <p>We'll be in touch with the details. If you have a question, or can no longer take part, just reply to this email.</p>
            <p>See you soon!<br />Centre for Apple Technologies, RIT</p>
          `,
        })
      } catch (error) {
        console.error('Failed to send program registration confirmation:', error)
      }
    })
  }

  return NextResponse.json({ success: true, alreadyRegistered, emailed: true })
}
