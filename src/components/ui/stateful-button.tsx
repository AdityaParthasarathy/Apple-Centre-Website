'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Loader2, Check } from 'lucide-react'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'loading' | 'success'

interface StatefulButtonProps
  extends Omit<ComponentProps<typeof motion.button>, 'onClick' | 'children'>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode
  /** Controlled mode — pass the parent's own pending/success state (e.g. a
   *  form's `submitting` flag) directly. Use this for `type="submit"`
   *  buttons inside a form whose onSubmit already owns the async work. */
  status?: Phase
  /** Uncontrolled mode — the button owns the async round-trip itself:
   *  spinner while the promise is pending, a checkmark for ~1.6s once it
   *  resolves, then back to idle. Ignored if `status` is passed. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown | Promise<unknown>
}

/** Built on the same motion.button + buttonVariants foundation as
 *  MotionButton (see motion-link.tsx) rather than a second button
 *  primitive — this is a state-aware variant, not a parallel component. */
export function StatefulButton({
  className,
  variant,
  size,
  children,
  status,
  onClick,
  disabled,
  ...props
}: StatefulButtonProps) {
  const [internalPhase, setInternalPhase] = useState<Phase>('idle')
  const isControlled = status !== undefined
  const phase = isControlled ? status : internalPhase

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isControlled || !onClick) return
    setInternalPhase('loading')
    try {
      await onClick(event)
      setInternalPhase('success')
      window.setTimeout(() => setInternalPhase('idle'), 1600)
    } catch {
      setInternalPhase('idle')
    }
  }

  return (
    <motion.button
      layout
      className={cn(buttonVariants({ variant, size }), 'gap-2', className)}
      whileHover={phase === 'idle' ? { scale: 1.04 } : undefined}
      whileTap={phase === 'idle' ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={handleClick}
      disabled={disabled || phase === 'loading'}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {phase === 'loading' && (
          <motion.span
            key="loading"
            layout
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 16, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center overflow-hidden"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.span>
        )}
        {phase === 'success' && (
          <motion.span
            key="success"
            layout
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 16, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center overflow-hidden"
          >
            <Check className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span layout>{children}</motion.span>
    </motion.button>
  )
}
