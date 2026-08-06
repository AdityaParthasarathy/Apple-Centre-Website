'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  name: string
  placeholder?: string
  className?: string
}

/** Type a value, press Enter or comma to add it as a removable chip. Syncs to a hidden input (comma-joined) for plain FormData submission. */
export function TagInput({ name, placeholder, className }: TagInputProps) {
  const [tags, setTags] = useState<string[]>([])
  const [value, setValue] = useState('')

  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (!tag || tags.includes(tag)) {
      setValue('')
      return
    }
    setTags((prev) => [...prev, tag])
    setValue('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
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
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(value)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <input type="hidden" name={name} value={tags.join(', ')} />
    </div>
  )
}
