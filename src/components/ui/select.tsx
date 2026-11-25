'use client'

import { useEffect } from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root

// The look of every dropdown list on the site (also used by SuggestInput).
export const dropdownPopupClass = cn(
  'w-[var(--anchor-width)] max-h-[min(16rem,var(--available-height))] overflow-y-auto rounded-lg border border-border/60 bg-card/95 p-1 text-sm shadow-lg backdrop-blur-md outline-none',
  'origin-[var(--transform-origin)] transition-[opacity,transform] duration-150',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0'
)
export const dropdownItemClass = cn(
  'flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-foreground outline-none',
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground'
)

export function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-input px-3.5 py-2.5 text-left text-sm text-foreground outline-none transition',
        'focus:border-ring focus:ring-1 focus:ring-ring/50',
        'data-[popup-open]:border-ring data-[popup-open]:ring-1 data-[popup-open]:ring-ring/50',
        'data-[placeholder]:text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-muted-foreground">
        <ChevronDown className="h-4 w-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export const SelectValue = SelectPrimitive.Value

// Room the list needs under its field (about the list's own height).
const ROOM_NEEDED_PX = 280

/** Rendered inside the open list: scrolls the page up when the field is so low
 *  that the list wouldn't fit under it. */
function MakeRoomBelow() {
  useEffect(() => {
    const trigger = document.querySelector<HTMLElement>('[data-popup-open]')
    if (!trigger) return
    const shortBy = ROOM_NEEDED_PX - (window.innerHeight - trigger.getBoundingClientRect().bottom)
    if (shortBy > 0) window.scrollBy({ top: shortBy, behavior: 'smooth' })
  }, [])
  return null
}

export function SelectPopup({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      {/* A plain list under the field, never above it. Without
          alignItemWithTrigger={false} the list is laid over the field, and
          without side: 'none' it flips above the field when it is low on the
          page; MakeRoomBelow scrolls the page instead. */}
      <SelectPrimitive.Positioner
        className="z-[80] outline-none"
        sideOffset={6}
        alignItemWithTrigger={false}
        collisionAvoidance={{ side: 'none' }}
      >
        <SelectPrimitive.Popup className={cn(dropdownPopupClass, className)} {...props}>
          <MakeRoomBelow />
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item className={cn(dropdownItemClass, className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
