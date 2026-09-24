'use client'

import { useEffect, type RefObject } from 'react'
import { useMotionValue, type MotionValue } from 'motion/react'

// Scroll-linked motion without `useScroll`.
//
// framer-motion's `useScroll` re-measures its container AND target on every
// scroll frame — offsetTop/offsetLeft up the whole parent chain, plus
// client/scroll sizes — straight after other code (Lenis, the motion values
// themselves) has written to the page. Each of those reads forces the browser
// to recompute style and layout on the spot. With eight trackers on the home
// page that was ~800 forced layouts a second while scrolling: profiled at
// ~52,000 in five seconds of scrolling the monitor section, which is what
// pinned the main thread and made scrolling stutter on ordinary laptops.
//
// These hooks measure an element's position once (and again only when the
// element or the page actually resizes) and after that turn each scroll event
// into a motion value using nothing but `window.scrollY`, which does not force
// layout.

type Edge = 'start' | 'center' | 'end'
/** Same meaning as framer-motion's `offset`: "<edge of the element> <edge of the viewport>". */
export type ScrollOffset = [`${Edge} ${Edge}`, `${Edge} ${Edge}`]

const fraction = (edge: string) => (edge === 'start' ? 0 : edge === 'end' ? 1 : 0.5)
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** window.scrollY as a motion value. */
export function useScrollY(): MotionValue<number> {
  const y = useMotionValue(0)

  useEffect(() => {
    const update = () => y.set(window.scrollY)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [y])

  return y
}

/** 0 → 1 as the page scrolls from the very top to the very bottom. */
export function usePageScrollProgress(): MotionValue<number> {
  const progress = useMotionValue(0)

  useEffect(() => {
    let range = 1
    const measure = () => {
      range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      update()
    }
    const update = () => progress.set(clamp01(window.scrollY / range))

    measure()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', measure)
    const observer = new ResizeObserver(measure)
    observer.observe(document.documentElement)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [progress])

  return progress
}

/** 0 → 1 as `ref`'s element moves through the viewport, per `offset` (default
 *  is framer's: from its top entering the bottom edge to its bottom leaving
 *  the top edge). */
export function useElementScrollProgress(
  ref: RefObject<HTMLElement | null>,
  offset: ScrollOffset = ['start end', 'end start']
): MotionValue<number> {
  const progress = useMotionValue(0)
  const [startOffset, endOffset] = offset

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const [startEl, startView] = startOffset.split(' ')
    const [endEl, endView] = endOffset.split(' ')
    let top = 0
    let height = 0
    let viewport = 0

    const update = () => {
      const from = top + height * fraction(startEl) - viewport * fraction(startView)
      const to = top + height * fraction(endEl) - viewport * fraction(endView)
      progress.set(to === from ? 0 : clamp01((window.scrollY - from) / (to - from)))
    }
    const measure = () => {
      const rect = element.getBoundingClientRect()
      top = rect.top + window.scrollY
      height = rect.height
      viewport = window.innerHeight
      update()
    }

    measure()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', measure)
    // The element's own size, and the page's: content loading in above it
    // (images, fonts) moves it without the element itself resizing.
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [ref, progress, startOffset, endOffset])

  return progress
}
