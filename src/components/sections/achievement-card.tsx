import Image from 'next/image'
import { Medal, MapPin, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn, isExternalImage, cardImage } from '@/lib/utils'
import { achievementTier, type Achievement, type AchievementTier } from '@/content/achievements'

// Text colours are picked for contrast against their own tinted badge
// background (900-on-100), not against the card behind it.
const TIER_STYLES: Record<AchievementTier, { panel: string; icon: string; badge: string }> = {
  gold: {
    panel: 'from-amber-200/70 via-amber-100/50 to-amber-50/30',
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-900',
  },
  silver: {
    panel: 'from-zinc-300/70 via-zinc-200/50 to-zinc-100/30',
    icon: 'text-zinc-500',
    badge: 'bg-zinc-200 text-zinc-800',
  },
  bronze: {
    panel: 'from-orange-200/70 via-orange-100/50 to-orange-50/30',
    icon: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-900',
  },
  special: {
    panel: 'from-accent/25 via-accent/10 to-primary/10',
    icon: 'text-accent',
    badge: 'bg-accent text-accent-foreground',
  },
}

interface AchievementCardProps {
  achievement: Achievement
  /** Heading level for the title — h3 under a section heading, h2 under the page's h1. */
  as?: 'h2' | 'h3'
  /** Cap the description at three lines (homepage preview); the full page shows it all. */
  clampDescription?: boolean
}

export function AchievementCard({ achievement, as: Heading = 'h3', clampDescription = false }: AchievementCardProps) {
  const styles = TIER_STYLES[achievementTier(achievement.placement)]

  return (
    <Card className="group flex h-full flex-col overflow-hidden">
      <div className="relative h-40 shrink-0 overflow-hidden">
        {achievement.image ? (
          <Image
            src={cardImage(achievement.image)}
            alt={achievement.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={isExternalImage(achievement.image)}
          />
        ) : (
          <div className={cn('flex h-full items-center justify-center bg-gradient-to-br', styles.panel)}>
            <Trophy className={cn('h-14 w-14', styles.icon)} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
            styles.badge
          )}
        >
          <Medal className="h-3.5 w-3.5" aria-hidden="true" />
          {achievement.placement}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <Heading className="text-lg font-semibold leading-snug text-foreground">{achievement.title}</Heading>
        {achievement.institution && (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{achievement.institution}</span>
          </p>
        )}
        {achievement.description && (
          <p className={cn('text-sm text-muted-foreground', clampDescription && 'line-clamp-3')}>
            {achievement.description}
          </p>
        )}
      </div>
    </Card>
  )
}
