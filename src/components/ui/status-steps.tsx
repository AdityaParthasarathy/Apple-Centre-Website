import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/lib/sheet-types'

const STEPS: ApplicationStatus[] = ['Pending', 'Reviewed', 'Accepted']

/** Read-only visual progress for a real ApplicationStatus — the Select
 *  next to it (see applications-manager.tsx) is what actually changes it;
 *  this just makes where an application sits in the pipeline scannable at
 *  a glance, driven by the same real status field, not a hardcoded demo
 *  step count. */
export function StatusSteps({ status }: { status: ApplicationStatus }) {
  if (status === 'Rejected') {
    return <p className="text-xs font-medium text-destructive">Rejected</p>
  }

  const activeIndex = STEPS.indexOf(status)

  return (
    <ol className="flex items-center">
      {STEPS.map((step, idx) => {
        const done = idx < activeIndex
        const current = idx === activeIndex
        return (
          <li key={step} className="flex items-center">
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold',
                  done && 'border-accent bg-accent text-accent-foreground',
                  current && 'border-accent text-accent',
                  !done && !current && 'border-border text-muted-foreground'
                )}
              >
                {done ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span className={cn('text-xs', current ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {step}
              </span>
            </span>
            {idx < STEPS.length - 1 && <span className="mx-2 h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}
