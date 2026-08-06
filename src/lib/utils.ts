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
