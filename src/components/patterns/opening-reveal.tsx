'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

interface OpeningRevealProps {
  onComplete?: () => void
}

const AUTO_DISMISS_MS = 3000

export function OpeningReveal({ onComplete }: OpeningRevealProps) {
  // Always start visible so server-rendered HTML matches the client's first
  // paint; sessionStorage is only consulted after mount, in an effect.
  const [isVisible, setIsVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)

  const handleComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  const dismiss = useCallback(() => {
    setIsVisible(false)
    sessionStorage.setItem('openingReveal', 'true')
    handleComplete()
    // Belt-and-suspenders: hide the node directly too, immediately and
    // synchronously. This is a splash screen someone is actively trying to
    // get past, so it must never fail to disappear on click — regardless
    // of any React re-render/commit timing this component instance might
    // be caught in.
    if (rootRef.current) {
      rootRef.current.style.display = 'none'
    }
  }, [handleComplete])

  useEffect(() => {
    if (sessionStorage.getItem('openingReveal')) {
      // Syncing with browser storage, which is unavailable during SSR —
      // this can only happen after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(false)
      handleComplete()
      return
    }

    // Dismisses itself automatically — this is a brief splash, not a
    // gate the visitor has to act on. "Skip" below is only for people
    // who don't want to wait even that long.
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [handleComplete, dismiss])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={rootRef}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <div className="relative flex flex-col items-center justify-center gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src="/logo-icon.png"
                alt="Centre for Apple Technologies"
                width={64}
                height={64}
                className="h-14 w-14 rounded-2xl sm:h-16 sm:w-16"
                priority
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-1 text-center"
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Apple Centre
              </h1>
              <p className="text-sm text-muted-foreground">
                Rajalakshmi Institute of Technology
              </p>
            </motion.div>

            {/* Underline accent — draws itself in, purely decorative */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="h-px w-16 origin-center bg-gradient-to-r from-transparent via-accent to-transparent"
            />

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              onClick={dismiss}
              className="mt-2 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Skip intro
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
