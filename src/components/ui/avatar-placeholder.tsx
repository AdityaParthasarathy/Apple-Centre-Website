import { cn } from '@/lib/utils'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

// Same six hues as the iMac colorways (imac-icon.tsx) — reused here instead
// of a separate palette so a staff member's color and, say, an iMac
// window's color read as the same design language.
const AVATAR_HUES = [
  'oklch(78% 0.13 12)', // pink
  'oklch(78% 0.14 48)', // orange
  'oklch(76% 0.1 235)', // blue
  'oklch(85% 0.12 95)', // yellow
  'oklch(78% 0.09 300)', // purple
  'oklch(80% 0.1 150)', // green
]

function colorForName(name: string) {
  const code = name.charCodeAt(0) || 0
  return AVATAR_HUES[code % AVATAR_HUES.length]
}

interface AvatarPlaceholderProps {
  name: string
  className?: string
  size?: 'sm' | 'lg'
  /** Tint the background deterministically by name instead of the flat
   *  --muted fill — for contexts showing several different people at once
   *  (e.g. a staff roster) where color helps tell them apart at a glance. */
  colored?: boolean
}

/** Initials-based fallback shown until a real photo is available. */
export function AvatarPlaceholder({ name, className, size = 'sm', colored = false }: AvatarPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center font-semibold text-foreground',
        colored ? '' : 'bg-muted',
        size === 'lg' ? 'text-6xl' : 'text-2xl',
        className
      )}
      style={colored ? { backgroundColor: colorForName(name) } : undefined}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}
