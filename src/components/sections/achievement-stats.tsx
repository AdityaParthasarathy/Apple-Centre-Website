import { achievementTier, type Achievement } from '@/content/achievements'

/** Headline numbers derived from the live list, so they stay right as staff add wins. */
export function AchievementStats({ achievements }: { achievements: Achievement[] }) {
  const count = (tier: string) => achievements.filter((a) => achievementTier(a.placement) === tier).length

  const stats = [
    { label: 'Prizes & awards', value: achievements.length },
    { label: 'First places', value: count('gold') },
    { label: 'Second places', value: count('silver') },
    { label: 'Third places', value: count('bronze') },
  ]

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-border bg-card/70 px-5 py-4 backdrop-blur-lg">
          <dd className="text-3xl font-black tracking-tight text-foreground">{stat.value}</dd>
          <dt className="mt-1 text-sm text-muted-foreground">{stat.label}</dt>
        </div>
      ))}
    </dl>
  )
}
