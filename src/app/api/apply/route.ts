import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { callAppsScript } from '@/lib/apps-script'

interface Application {
  name: string
  email: string
  phone: string
  year: string
  skills: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseApplication(formData: FormData): Application | null {
  const get = (key: string) => (formData.get(key)?.toString().trim() ?? '')

  const application: Application = {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    year: get('year'),
    skills: get('skills'),
  }

  const hasRequiredFields = application.name && application.email && application.year

  if (!hasRequiredFields || !EMAIL_PATTERN.test(application.email)) {
    return null
  }

  return application
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendNotificationEmail(application: Application) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, NOTIFY_EMAIL_TO } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !NOTIFY_EMAIL_TO) {
    throw new Error('Email notification is not configured (missing SMTP_* / NOTIFY_EMAIL_TO env vars).')
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })

  await transporter.sendMail({
    from: `"Apple Centre Applications" <${SMTP_USER}>`,
    to: NOTIFY_EMAIL_TO,
    replyTo: application.email,
    subject: `New Apple Centre application — ${application.name}`,
    html: `
      <h2>New membership application</h2>
      <p><strong>Name:</strong> ${escapeHtml(application.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(application.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(application.phone) || '&mdash;'}</p>
      <p><strong>Year:</strong> ${escapeHtml(application.year)}</p>
      <p><strong>Skills:</strong> ${escapeHtml(application.skills) || '&mdash;'}</p>
    `,
  })
}

async function logToSheet(application: Application) {
  await callAppsScript('logApplication', { ...application })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const application = parseApplication(formData)

  if (!application) {
    return NextResponse.json({ error: 'Please fill in all required fields with a valid email.' }, { status: 400 })
  }

  const [emailResult, sheetResult] = await Promise.allSettled([
    sendNotificationEmail(application),
    logToSheet(application),
  ])

  if (emailResult.status === 'rejected') {
    console.error('Failed to send application email:', emailResult.reason)
  }
  if (sheetResult.status === 'rejected') {
    console.error('Failed to log application to sheet:', sheetResult.reason)
  }

  if (emailResult.status === 'rejected' && sheetResult.status === 'rejected') {
    return NextResponse.json(
      { error: 'Something went wrong submitting your application. Please try again or email us directly.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
