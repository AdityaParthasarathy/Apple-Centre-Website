'use client'

import { useEffect, useRef } from 'react'
import { useLenis } from 'lenis/react'
import { GALLERY_FROM_KEY, GALLERY_RESTORE_KEY, GALLERY_SCROLL_KEY } from '@/components/ui/go-back-button'

/** On the gallery: when the visitor has just come back from a folder, scroll to
 *  where they were. Renders nothing. */
export function GalleryScrollRestore() {
  const lenis = useLenis()
  // The smooth-scroll engine starts a beat after the page does; the effect
  // below runs once and looks it up when it needs it.
  const lenisRef = useRef(lenis)
  useEffect(() => {
    lenisRef.current = lenis
  }, [lenis])

  useEffect(() => {
    let y: number | null = null
    try {
      if (sessionStorage.getItem(GALLERY_RESTORE_KEY) === '1') {
        const saved = Number(sessionStorage.getItem(GALLERY_SCROLL_KEY))
        y = Number.isFinite(saved) && saved > 0 ? saved : null
      }
      // Used once: a later plain visit to the gallery starts at the top.
      sessionStorage.removeItem(GALLERY_RESTORE_KEY)
      sessionStorage.removeItem(GALLERY_SCROLL_KEY)
      sessionStorage.removeItem(GALLERY_FROM_KEY)
    } catch {
      return
    }
    if (y === null) return

    const target = y
    const scrollThere = () => {
      if (lenisRef.current) lenisRef.current.scrollTo(target, { immediate: true, force: true })
      else window.scrollTo(0, target)
    }
    // Once now, and again shortly after: the router scrolls a freshly shown
    // page to the top itself, and would otherwise undo this.
    scrollThere()
    const timers = [80, 250, 600].map((ms) => window.setTimeout(scrollThere, ms))
    return () => timers.forEach(window.clearTimeout)
  }, [])

  return null
}
