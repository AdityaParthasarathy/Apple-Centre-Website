// Checks for what the members portal accepts. Members sign in with no password,
// so unlike staff nothing they send is trusted: every field is length-limited and
// every address is checked before it can reach the sheet or a public page.

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** A GitHub repository address: https://github.com/<owner>/<repo>[...]. */
export function isGithubRepoUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'github.com' || url.hostname === 'www.github.com') &&
      url.pathname.split('/').filter(Boolean).length >= 2
    )
  } catch {
    return false
  }
}

/** Pictures the site stored itself (Google Drive or Vercel Blob). A member can't
 *  point a project at someone else's image address. */
export function isOurImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'lh3.googleusercontent.com' || url.hostname.endsWith('.public.blob.vercel-storage.com'))
    )
  } catch {
    return false
  }
}

export type FieldKind = 'text' | 'url' | 'github' | 'username' | 'image' | 'email' | 'phone' | 'year' | 'enrollment' | 'option'

export interface FieldSpec {
  label: string
  kind?: FieldKind
  required?: boolean
  max?: number
  options?: readonly string[]
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_CHARS = /^\+?[0-9][0-9\s\-()]*$/
const ENROLLMENT = /^[A-Z0-9][A-Z0-9\-/]{3,19}$/
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/

function checkOne(raw: unknown, spec: FieldSpec): { value: string } | { error: string } {
  const label = spec.label
  const kind = spec.kind ?? 'text'
  if (raw !== undefined && raw !== null && typeof raw !== 'string') return { error: `Enter a valid ${label.toLowerCase()}.` }

  // Names and notes: stray runs of spaces collapse; line breaks in a long text are kept.
  let value = (raw ?? '').trim()
  if (kind !== 'text' || !(spec.max && spec.max > 200)) value = value.replace(/\s+/g, ' ')
  if (kind === 'enrollment') value = value.replace(/\s+/g, '').toUpperCase()
  if (kind === 'username') value = value.toLowerCase()

  if (!value) return spec.required ? { error: `${label} is required.` } : { value: '' }
  if (value.length > (spec.max ?? 200)) return { error: `${label} is too long.` }

  const bad = { error: `Enter a valid ${label.toLowerCase()}.` }
  switch (kind) {
    case 'url':
      return isHttpUrl(value) ? { value } : { error: `${label} must be a web address starting with http:// or https://.` }
    case 'github':
      return isGithubRepoUrl(value) ? { value } : { error: `${label} must be a GitHub repository address, like https://github.com/owner/repo.` }
    case 'image':
      return isOurImageUrl(value) ? { value } : { error: `${label} must be uploaded through the portal.` }
    case 'email':
      return EMAIL.test(value) ? { value } : bad
    case 'phone': {
      const digits = value.replace(/\D/g, '')
      return PHONE_CHARS.test(value) && digits.length >= 7 && digits.length <= 15 ? { value } : bad
    }
    case 'year':
      return ['1', '2', '3', '4'].includes(value) ? { value } : { error: 'Choose a year of study from 1 to 4.' }
    case 'username':
      return USERNAME.test(value)
        ? { value }
        : { error: 'Choose a username of 3 to 30 letters, digits, dots, dashes or underscores (no spaces).' }
    case 'enrollment':
      return ENROLLMENT.test(value) ? { value } : { error: 'Enter a valid enrollment number (letters, digits, - or /).' }
    case 'option':
      return spec.options?.includes(value) ? { value } : bad
    default:
      return { value }
  }
}

/** Reads exactly the fields in `spec` out of a request body and ignores anything
 *  else the caller sent, so a member can't set fields they were never offered. */
export function parseFields(
  body: unknown,
  spec: Record<string, FieldSpec>
): { values: Record<string, string> } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body.' }
  const values: Record<string, string> = {}
  for (const [key, field] of Object.entries(spec)) {
    const checked = checkOne((body as Record<string, unknown>)[key], field)
    if ('error' in checked) return checked
    values[key] = checked.value
  }
  return { values }
}

const MAX_BASE64 = 4_500_000

/** A picture as the portal sends it: base64 of the JPEG its browser produced. */
export function checkJpegBase64(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_BASE64 &&
    value.startsWith('/9j/') &&
    /^[A-Za-z0-9+/=]+$/.test(value)
  )
}
