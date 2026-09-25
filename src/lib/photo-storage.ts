import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'

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
// Only JPEGs (what the staff portal always sends: pictures are scaled and
// converted in the browser first) are taken; no image processing happens here,
// so nothing native has to load on the server.

// Blob's own client retries a failing request for minutes, which would leave
// the photo hanging until the function is cut off. A save that normally takes
// well under a second gets this long, then Drive takes over.
const BLOB_DEADLINE_MS = 10_000

export function isPhotoStorageConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID
}

/** Saves a picture; null means "not available, use Drive". A résumé, or any
 *  other document or picture type, is left to Drive. */
export async function storePhoto(input: { base64?: unknown; mimeType?: unknown }): Promise<{ url: string } | null> {
  if (!isPhotoStorageConfigured()) return null
  if (typeof input.base64 !== 'string' || input.mimeType !== 'image/jpeg') return null

  try {
    const bytes = Buffer.from(input.base64, 'base64')
    const controller = new AbortController()
    const saving = put(`photos/${randomUUID()}.jpg`, bytes, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      abortSignal: controller.signal,
    })
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new Error(`no answer from Vercel Blob within ${BLOB_DEADLINE_MS / 1000}s`))
      }, BLOB_DEADLINE_MS)
    })
    try {
      const stored = await Promise.race([saving, deadline])
      return { url: stored.url }
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
