import { NextResponse } from 'next/server'
import { callAppsScript } from '@/lib/apps-script'
import { escapeHtml, sendMail } from '@/lib/mailer'

// Uploading up to 3 screenshots (each its own Apps Script round-trip) can
// take a while on a slow response — give this route more room than the
// Vercel Hobby default of 10s.
export const maxDuration = 60

const PROJECT_SLOTS = 3

interface ProjectInput {
  description: string
  sourceLink: string
  liveLink: string
  screenshotBase64: string
  screenshotMimeType: string
}

interface Application {
  name: string
  email: string
  phone: string
  year: string
  skills: string
  techComfort: string
}

// Flat project1.../project2.../project3... fields, matching the sheet
// columns 1:1 (see SheetApplication) — built after screenshots upload.
type ProjectFields = Record<string, string>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseApplication(formData: FormData): Application | null {
  const get = (key: string) => (formData.get(key)?.toString().trim() ?? '')

  const application: Application = {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    year: get('year'),
    skills: get('skills'),
    techComfort: get('techComfort'),
  }

  const hasRequiredFields = application.name && application.email && application.year

  if (!hasRequiredFields || !EMAIL_PATTERN.test(application.email)) {
    return null
  }

  return application
}

/** Reads project1../project2../project3.. out of the FormData. A slot with
 *  no description is treated as not filled in and skipped entirely. */
function parseProjects(formData: FormData): ProjectInput[] {
  const get = (key: string) => (formData.get(key)?.toString().trim() ?? '')
  const projects: ProjectInput[] = []

  for (let i = 1; i <= PROJECT_SLOTS; i++) {
    const description = get(`project${i}Description`)
    if (!description) continue
    projects.push({
      description,
      sourceLink: get(`project${i}SourceLink`),
      liveLink: get(`project${i}LiveLink`),
      screenshotBase64: get(`project${i}ScreenshotBase64`),
      screenshotMimeType: get(`project${i}ScreenshotMimeType`) || 'image/jpeg',
    })
  }
  return projects
}

/** Resume is optional — parsed the same base64-in-a-hidden-field way the
 *  project screenshots already are (see ScreenshotState in apply-form.tsx),
 *  uploaded through the same Apps Script action. */
async function uploadResume(formData: FormData): Promise<string> {
  const base64 = formData.get('resumeBase64')?.toString() ?? ''
  if (!base64) return ''
  const mimeType = formData.get('resumeMimeType')?.toString() || 'application/pdf'
  try {
    const result = await callAppsScript<{ url: string }>('uploadImage', {
      base64,
      mimeType,
      filename: 'application-resume.pdf',
    })
    return result.url
  } catch (error) {
    console.error('Failed to upload resume:', error)
    return ''
  }
}

function validateProjects(projects: ProjectInput[]): string | null {
  for (const project of projects) {
    if (!project.sourceLink && !project.liveLink) {
      return 'Each project needs a source/zip link, a live link, or both.'
    }
  }
  return null
}

/** Uploads any provided screenshots (in parallel) and returns the flat
 *  project1Description/project1SourceLink/... fields the sheet expects,
 *  with project{n}Screenshot filled in from the upload result. */
async function uploadScreenshotsAndFlatten(projects: ProjectInput[]): Promise<ProjectFields> {
  const uploads = await Promise.all(
    projects.map(async (project, idx) => {
      if (!project.screenshotBase64) return null
      try {
        const result = await callAppsScript<{ url: string }>('uploadImage', {
          base64: project.screenshotBase64,
          mimeType: project.screenshotMimeType,
          filename: `application-project-${idx + 1}.jpg`,
        })
        return result.url
      } catch (error) {
        console.error(`Failed to upload screenshot for project ${idx + 1}:`, error)
        return null
      }
    })
  )

  const fields: ProjectFields = {}
  projects.forEach((project, idx) => {
    const n = idx + 1
    fields[`project${n}Description`] = project.description
    fields[`project${n}SourceLink`] = project.sourceLink
    fields[`project${n}LiveLink`] = project.liveLink
    fields[`project${n}Screenshot`] = uploads[idx] ?? ''
  })
  return fields
}

function projectsEmailHtml(projects: ProjectInput[], projectFields: ProjectFields) {
  if (projects.length === 0) return '<p><strong>Projects:</strong> &mdash;</p>'
  return projects
    .map((_, idx) => {
      const n = idx + 1
      const description = projectFields[`project${n}Description`]
      const sourceLink = projectFields[`project${n}SourceLink`]
      const liveLink = projectFields[`project${n}LiveLink`]
      const screenshot = projectFields[`project${n}Screenshot`]
      return `
        <p style="margin-top:12px"><strong>Project ${n}:</strong> ${escapeHtml(description)}</p>
        <ul style="margin-top:0">
          ${sourceLink ? `<li>Source: <a href="${escapeHtml(sourceLink)}">${escapeHtml(sourceLink)}</a></li>` : ''}
          ${liveLink ? `<li>Live: <a href="${escapeHtml(liveLink)}">${escapeHtml(liveLink)}</a></li>` : ''}
          ${screenshot ? `<li>Screenshot: <a href="${escapeHtml(screenshot)}">${escapeHtml(screenshot)}</a></li>` : ''}
        </ul>
      `
    })
    .join('')
}

async function sendNotificationEmail(
  application: Application,
  resumeUrl: string,
  projects: ProjectInput[],
  projectFields: ProjectFields
) {
  const { NOTIFY_EMAIL_TO } = process.env
  if (!NOTIFY_EMAIL_TO) {
    throw new Error('Email notification is not configured (missing NOTIFY_EMAIL_TO env var).')
  }

  await sendMail({
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
      <p><strong>Tech comfort:</strong> ${escapeHtml(application.techComfort) || '&mdash;'}</p>
      <p><strong>Resume:</strong> ${resumeUrl ? `<a href="${escapeHtml(resumeUrl)}">${escapeHtml(resumeUrl)}</a>` : '&mdash;'}</p>
      ${projectsEmailHtml(projects, projectFields)}
    `,
  })
}

async function logToSheet(application: Application, resumeUrl: string, projectFields: ProjectFields) {
  await callAppsScript('logApplication', { ...application, resumeUrl, ...projectFields })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const application = parseApplication(formData)

  if (!application) {
    return NextResponse.json({ error: 'Please fill in all required fields with a valid email.' }, { status: 400 })
  }

  const projects = parseProjects(formData)
  const projectError = validateProjects(projects)
  if (projectError) {
    return NextResponse.json({ error: projectError }, { status: 400 })
  }

  const [projectFields, resumeUrl] = await Promise.all([
    uploadScreenshotsAndFlatten(projects),
    uploadResume(formData),
  ])

  const [emailResult, sheetResult] = await Promise.allSettled([
    sendNotificationEmail(application, resumeUrl, projects, projectFields),
    logToSheet(application, resumeUrl, projectFields),
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
