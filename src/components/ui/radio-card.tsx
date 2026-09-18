import { cn } from '@/lib/utils'

export interface RadioCardOption {
  value: string
  title: string
  description: string
}

/** A group of selectable cards for one radio choice — native <input
 *  type="radio"> under the hood (full keyboard/screen-reader support for
 *  free), styled with Tailwind's has-[:checked] variant rather than a
 *  separate headless RadioGroup dependency. */
export function RadioCardGroup({
  name,
  options,
  defaultValue,
  className,
  ariaLabelledby,
}: {
  name: string
  options: RadioCardOption[]
  defaultValue?: string
  className?: string
  /** id of the element asking the question this group answers — a
   *  role="radiogroup" has no accessible name of its own, so without this
   *  a screen reader announces the options with no idea what they're
   *  choosing between. */
  ariaLabelledby: string
}) {
  return (
    <div className={cn('space-y-2', className)} role="radiogroup" aria-labelledby={ariaLabelledby}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-input px-4 py-3 text-sm transition has-[:checked]:border-ring has-[:checked]:bg-accent/5 has-[:checked]:ring-1 has-[:checked]:ring-ring/50"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === defaultValue}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span>
            <span className="block font-medium text-foreground">{option.title}</span>
            <span className="block text-muted-foreground">{option.description}</span>
          </span>
        </label>
      ))}
    </div>
  )
}
