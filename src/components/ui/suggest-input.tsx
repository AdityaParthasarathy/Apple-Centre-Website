'use client'

import { useRef } from 'react'
import { Autocomplete } from '@base-ui/react/autocomplete'
import { ChevronDown } from 'lucide-react'
import { cn, inputClass } from '@/lib/utils'
import { dropdownItemClass, dropdownPopupClass } from '@/components/ui/select'

// Room the list needs under the field before it opens (about its own height).
const ROOM_NEEDED_PX = 280

/** A text box that suggests options in the site's dropdown style but still takes
 *  anything typed — for fields like a department, where the usual answers are
 *  known but not the only ones. (The browser's own suggestion list, `<datalist>`,
 *  can't be styled and opens wherever the browser likes.) */
export function SuggestInput({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  required,
  maxLength,
  name,
  className,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  required?: boolean
  maxLength?: number
  name?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const typed = value.trim().toLowerCase()
  // Once the box holds one of the options, show them all again so another can be picked.
  const exact = options.some((option) => option.toLowerCase() === typed)

  const makeRoom = (open: boolean) => {
    if (!open || !inputRef.current) return
    // The list always opens below the field, so scroll the field up if the
    // list wouldn't fit there.
    const shortBy = ROOM_NEEDED_PX - (window.innerHeight - inputRef.current.getBoundingClientRect().bottom)
    if (shortBy > 0) window.scrollBy({ top: shortBy, behavior: 'smooth' })
  }

  return (
    <Autocomplete.Root
      items={options as string[]}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      onOpenChange={makeRoom}
      filter={exact ? () => true : undefined}
      openOnInputClick
    >
      <Autocomplete.InputGroup className="relative">
        <Autocomplete.Input
          ref={inputRef}
          id={id}
          name={name}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(inputClass, 'pr-10', className)}
        />
        <Autocomplete.Trigger
          aria-label="Show suggestions"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Autocomplete.Trigger>
      </Autocomplete.InputGroup>

      <Autocomplete.Portal>
        <Autocomplete.Positioner
          className="z-[80] outline-none"
          sideOffset={6}
          // Always under the field; it never flips above it.
          collisionAvoidance={{ side: 'none' }}
        >
          <Autocomplete.Popup className={dropdownPopupClass}>
            <Autocomplete.List className="outline-none">
              {(option: string) => (
                <Autocomplete.Item key={option} value={option} className={dropdownItemClass}>
                  {option}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}
