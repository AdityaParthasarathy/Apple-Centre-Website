'use client'

import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root

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

export function SelectPopup({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner className="z-50 outline-none" sideOffset={6}>
        <SelectPrimitive.Popup
          className={cn(
            'w-[var(--anchor-width)] max-h-64 overflow-y-auto rounded-lg border border-border/60 bg-card/95 p-1 text-sm shadow-lg backdrop-blur-md outline-none',
            'origin-[var(--transform-origin)] transition-[opacity,transform] duration-150',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            className
          )}
          {...props}
        >
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
    <SelectPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-foreground outline-none',
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
