import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccordionItem {
  question: string
  answer: string
}

/** Native <details>/<summary> — full keyboard support and no JS needed for
 *  the open/close state itself, styled to match the rest of this site. */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  return (
    <div className={cn('divide-y divide-border rounded-lg border border-border', className)}>
      {items.map((item, idx) => (
        <details key={idx} className="group p-4 sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
