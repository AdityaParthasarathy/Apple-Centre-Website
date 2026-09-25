import { compressImage } from '@/lib/image-compress'

/** Most photos taken in one go: each is uploaded on its own, and a very long
 *  queue is better split up than left running in one tab. */
export const MAX_BATCH = 30

export interface PreparedPhoto {
  key: string
  /** The file's name without its extension, for a caption. */
  name: string
  /** A data: address to show the picture with while it uploads. */
  preview: string
  base64: string
  mimeType: string
}

/** Shrinks each chosen file the way single uploads are shrunk, a few at a
 *  time. Files that can't be read are counted, not fatal. */
export async function preparePhotos(
  files: File[],
  onProgress?: (done: number) => void
): Promise<{ photos: PreparedPhoto[]; failed: number }> {
  const prepared: (PreparedPhoto | null)[] = new Array(files.length).fill(null)
  let next = 0
  let done = 0
  let failed = 0

  const worker = async () => {
    while (next < files.length) {
      const i = next++
      try {
        const { base64, mimeType } = await compressImage(files[i])
        prepared[i] = {
          key: crypto.randomUUID(),
          name: files[i].name.replace(/\.[^.]+$/, ''),
          preview: `data:${mimeType};base64,${base64}`,
          base64,
          mimeType,
        }
      } catch {
        failed++
      }
      onProgress?.(++done)
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker))

  return { photos: prepared.filter((p): p is PreparedPhoto => p !== null), failed }
}

/** Runs `task` over `items`, at most `size` at once. */
export async function runPool<T>(items: T[], size: number, task: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      await task(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker))
}
