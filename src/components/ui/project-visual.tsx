import { Bot, Sprout, Siren, Trophy, Smartphone, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = { bot: Bot, sprout: Sprout, siren: Siren, trophy: Trophy }

interface ProjectVisualProps {
  iconKey?: string
  className?: string
}

/** Placeholder shown in place of a real screenshot until one is available. */
export function ProjectVisual({ iconKey, className }: ProjectVisualProps) {
  const Icon = (iconKey && ICONS[iconKey]) || Smartphone
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-accent/20 via-accent/10 to-primary/10',
        className
      )}
    >
      <Icon className="h-10 w-10 text-accent" strokeWidth={1.5} />
    </div>
  )
}
