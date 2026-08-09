import nodemailer from 'nodemailer'

export function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface SendMailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/** Shared SMTP sender for every outgoing email this site sends (new
 *  application -> staff, decision -> applicant). One transporter config,
 *  one place to fix if the SMTP setup ever changes. */
export async function sendMail({ to, subject, html, replyTo }: SendMailOptions) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('Email is not configured (missing SMTP_* env vars).')
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })

  await transporter.sendMail({
    from: `"Centre for Apple Technologies" <${SMTP_USER}>`,
    to,
    replyTo,
    subject,
    html,
  })
}
