import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import sharp from 'sharp'

// Where new photos are kept.
//
// Google's script takes 4-60s to save a picture to Drive, and every so often
// loses its reply. Vercel Blob is file storage built for exactly this: a photo
// is saved in a fraction of a second, reliably. It is on whenever a Blob store
// is attached to the project in Vercel, which adds either BLOB_STORE_ID (newer
// stores: the site then signs in with the token Vercel hands every deployment)
// or BLOB_READ_WRITE_TOKEN (older ones). Without one of them, or if a save here
// ever fails, the photo goes to Drive through the script as it always has, so
// turning this on cannot make anything worse.
//
// Each photo is stored twice, the picture as sent (already scaled to 1280px in
// the browser) and a 640px copy next to it — same address with "-640" before
// the extension — which cards use so a page full of photos doesn't download a
// page full of large pictures (see cardImage in lib/utils.ts).

export const BLOB_HOST_SUFFIX = '.blob.vercel-storage.com'
export const THUMB_WIDTH = 640

// Blob's own client retries a failing request for minutes, which would leave
// the photo hanging until the function is cut off. A save that normally takes
// well under a second gets this long, then Drive takes over.
const BLOB_DEADLINE_MS = 10_000

export function isPhotoStorageConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID
}

/** Saves a picture; null means "not available, use Drive". Only pictures: a
 *  résumé or any other document is left to Drive. */
export async function storePhoto(input: { base64?: unknown; mimeType?: unknown }): Promise<{ url: string } | null> {
  if (!isPhotoStorageConfigured()) return null
  if (typeof input.base64 !== 'string' || typeof input.mimeType !== 'string' || !input.mimeType.startsWith('image/')) return null

  try {
    const original = Buffer.from(input.base64, 'base64')
    // Only JPEGs are stored as sent; anything else (a PNG screenshot) is
    // converted so both copies share one extension and address pattern.
    const [full, thumb] = await Promise.all([
      input.mimeType === 'image/jpeg' ? original : sharp(original).rotate().jpeg({ quality: 85 }).toBuffer(),
      sharp(original).rotate().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer(),
    ])

    const id = randomUUID()
    const controller = new AbortController()
    const options = {
      access: 'public' as const,
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      abortSignal: controller.signal,
    }
    // Both must be saved: a card asks for the small copy by name.
    const saving = Promise.all([put(`photos/${id}.jpg`, full, options), put(`photos/${id}-${THUMB_WIDTH}.jpg`, thumb, options)])
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new Error(`no answer from Vercel Blob within ${BLOB_DEADLINE_MS / 1000}s`))
      }, BLOB_DEADLINE_MS)
    })
    try {
      const [main] = await Promise.race([saving, deadline])
      return { url: main.url }
    } finally {
      clearTimeout(timer)
      // The abandoned attempt must not surface later as an unhandled rejection.
      saving.catch(() => undefined)
    }
  } catch (error) {
    console.error('Saving the photo to Vercel Blob failed; using Drive instead:', error)
    return null
  }
}
