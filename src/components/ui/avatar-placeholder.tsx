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

interface AvatarPlaceholderProps {
  name: string
  className?: string
  size?: 'sm' | 'lg'
}

/** Initials-based fallback shown until a real photo is available. */
export function AvatarPlaceholder({ name, className, size = 'sm' }: AvatarPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-muted font-semibold text-foreground',
        size === 'lg' ? 'text-6xl' : 'text-2xl',
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}
