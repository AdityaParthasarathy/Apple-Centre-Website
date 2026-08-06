'use client'

import { ReactLenis } from 'lenis/react'
import type { ReactNode } from 'react'
import { ScrollProgress } from '@/components/patterns/scroll-progress'

// Defined here, not passed in as a prop from a Server Component — a
// function value can't cross the server/client boundary as a prop, only
// as something already living inside a 'use client' module like this one.
const lenisOptions = {
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={lenisOptions}>
      <ScrollProgress />
      {children}
    </ReactLenis>
  )
}
