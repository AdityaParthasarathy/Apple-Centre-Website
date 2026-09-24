'use client'

import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-lg border border-border bg-input px-3.5 py-2.5 pr-12 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring/50'

/** A password field with a show/hide toggle — used on the staff sign-in.
 *  Matches this site's plain input styling (see apply-form.tsx's inputClass)
 *  rather than a component library's Input primitive. */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        <input ref={ref} type={visible ? 'text' : 'password'} className={cn(inputClass, className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
