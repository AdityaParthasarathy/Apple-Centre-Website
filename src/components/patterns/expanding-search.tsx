'use client'

import { motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { searchItems, type SearchItem } from '@/lib/search-index'

interface ExpandingSearchProps {
  placeholder?: string
  items: SearchItem[]
}

const COLLAPSED_SIZE = 40
const EXPANDED_WIDTH = 320

export function ExpandingSearch({ placeholder = 'Search...', items }: ExpandingSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const results = useMemo(() => searchItems(items, query), [items, query])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen, handleClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (results[0]) {
      router.push(results[0].href)
      handleClose()
    }
  }

  return (
    <form ref={containerRef} onSubmit={handleSubmit} className="relative">
      <motion.div
        className="relative h-10"
        animate={{ width: isOpen ? EXPANDED_WIDTH : COLLAPSED_SIZE }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Collapsed: no border/background at all, so it reads as a plain
            icon button. Only once expanded does this become a visible
            input field — it's never rendered "full width but tiny",
            which was the mismatched-oval bug. */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && handleClose()}
          placeholder={placeholder}
          tabIndex={isOpen ? 0 : -1}
          className={cn(
            'absolute inset-0 h-full w-full rounded-full py-2 pl-4 pr-10 text-sm text-foreground placeholder-muted-foreground outline-none transition-opacity duration-150',
            isOpen
              ? 'border border-border bg-input opacity-100 focus:border-ring focus:ring-1 focus:ring-ring/50'
              : 'pointer-events-none border-transparent bg-transparent opacity-0'
          )}
        />

        <div className="absolute right-0 top-0 h-10 w-10">
          <motion.button
            type="button"
            onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
            aria-label={isOpen ? 'Close search' : 'Open search'}
            className="flex h-full w-full items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen && query ? (
              <X className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Live results dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {results.length > 0 ? (
            <ul className="divide-y divide-border">
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={handleClose}
                    className="block px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          )}
        </div>
      )}
    </form>
  )
}
