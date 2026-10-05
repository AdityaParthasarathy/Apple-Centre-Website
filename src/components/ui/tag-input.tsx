'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** "Swift, SwiftUI , Xcode" -> ["Swift", "SwiftUI", "Xcode"]. The staff forms
 *  keep a list of tags as one comma-separated string (that is how the sheet
 *  stores it), so this and `tagsToText` convert at the edges. */
export function parseTags(text: string | undefined): string[] {
  return (text ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function tagsToText(tags: string[]): string {
  return tags.join(', ')
}

interface TagInputProps {
  /** For plain FormData submission: the tags are mirrored into a hidden input of this name (comma-joined). */
  name?: string
  /** Pass `id` so a <label htmlFor> reaches the typing box. */
  id?: string
  placeholder?: string
  className?: string
  /** Controlled mode: the form owns the list (needed to keep a draft, or to fill it when editing). */
  value?: string[]
  onValueChange?: (tags: string[]) => void
}

/** Type a value, press Enter or comma to add it as a removable chip. Works on
 *  its own (public forms read the hidden input) or controlled by a form's state
 *  (staff forms). */
export function TagInput({ name, id, placeholder, className, value: controlled, onValueChange }: TagInputProps) {
  const [ownTags, setOwnTags] = useState<string[]>([])
  const [value, setValue] = useState('')
  const tags = controlled ?? ownTags

  const commit = (next: string[]) => {
    if (controlled === undefined) setOwnTags(next)
    onValueChange?.(next)
  }

  const addTag = (raw: string) => {
    const tag = raw.trim()
    setValue('')
    // Case-insensitive, so "swift" can't be added next to "Swift".
    if (!tag || tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return
    commit([...tags, tag])
  }

  const removeTag = (tag: string) => {
    commit(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(value)
    } else if (e.key === 'Backspace' && !value && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-lg border border-border bg-input px-3 py-2 transition',
        'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50',
        className
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-accent/15 py-1 pl-2.5 pr-1.5 text-xs font-medium text-accent"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
            className="rounded-full p-0.5 hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(value)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      {name && <input type="hidden" name={name} value={tagsToText(tags)} />}
    </div>
  )
}
