import { cn } from '@/lib/utils'

const LEVELS = ['Too short', 'Weak', 'Medium', 'Strong', 'Very strong'] as const

/** Length + character-class diversity, computed inline rather than pulling
 *  in check-password-strength — the actual scoring logic is about 10 lines
 *  and this site has no other password-scoring need to justify a
 *  dependency for it.
 *
 *  Not currently mounted anywhere: this app has no flow that sets or
 *  changes a staff password today (login only checks an existing hash —
 *  see api/staff/login/route.ts), so there's nowhere for a strength meter
 *  to attach yet. Built ahead of that feature, not instead of asking
 *  whether it should exist. */
export function scorePassword(password: string): number {
  if (!password) return 0
  if (password.length < 6) return 1

  let diversity = 0
  if (/[a-z]/.test(password)) diversity++
  if (/[A-Z]/.test(password)) diversity++
  if (/[0-9]/.test(password)) diversity++
  if (/[^a-zA-Z0-9]/.test(password)) diversity++

  if (password.length >= 10 && diversity >= 4) return 4
  if (password.length >= 8 && diversity >= 3) return 3
  if (password.length >= 6 && diversity >= 2) return 2
  return 1
}

export function PasswordStrengthMeter({ password, className }: { password: string; className?: string }) {
  const score = scorePassword(password)

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              step <= score ? scoreColor(score) : 'bg-muted'
            )}
          />
        ))}
      </div>
      {password && <p className="text-xs text-muted-foreground">{LEVELS[score]}</p>}
    </div>
  )
}

function scoreColor(score: number) {
  if (score <= 1) return 'bg-destructive'
  if (score === 2) return 'bg-amber-500'
  if (score === 3) return 'bg-accent'
  return 'bg-emerald-500'
}
