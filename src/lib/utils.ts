import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Shared text-input styling — used anywhere a raw `<input>`/`<textarea>` stands in for a form primitive. */
export const inputClass =
  "w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring/50"

/** Faculty-uploaded/pasted image URLs are arbitrary external domains (Drive,
 *  or wherever) — next/image can only optimize allowlisted domains, so these
 *  render unoptimized instead of failing outright. */
export function isExternalImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://")
}

/** Photos staff upload are stored on Google's image host at up to 1600px wide
 *  (the `=w1600` suffix in their URL), and that host resizes on request. A
 *  card that shows a photo ~300px wide has no use for the 1600px original —
 *  on a gallery of phone photos that is several hundred KB each to download and
 *  decode, all to be drawn small. This asks for `width` instead; anything that
 *  isn't one of those URLs (local files, other hosts) is returned untouched. */
export function cardImage(src: string, width = 640) {
  // A record with no image at all must not take the whole page down with it.
  if (!src || !src.startsWith("https://lh3.googleusercontent.com/")) return src
  return src.replace(/=w\d+[^/]*$/, `=w${width}`)
}
