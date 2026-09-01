'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useLenis } from 'lenis/react'
import { IMacMarqueeField } from '@/components/patterns/imac-marquee-field'

// Three iMacs in sequence — About, Labs & Facilities, Student Projects —
// each auto-driven by its own scroll runway instead of a click: as you
// scroll into one, its shell grows and its bezel/chin/stand dissolve until
// the screen fills the viewport and the live embedded section
// (?embed=1&section=<id> — see page.tsx for why that flag exists, and why
// it renders ONLY that one section rather than the whole site) fades in.
// Once open, the iframe becomes scroll-interactive (see iframePointerEvents
// below) so you can actually scroll through everything in that section —
// ordinary browser scroll-chaining then hands control back to this page,
// continuing the same motion in reverse (content fades, shell shrinks,
// bezel returns) right as you reach the bottom of that section, before the
// next iMac starts growing in turn. No click, no modal, no state of our
// own: purely a function of scroll position.
const WINDOWS = [
  { id: 'about', label: 'About the Centre', color: 'oklch(80% 0.1 150)' },
  { id: 'facilities', label: 'Labs & Facilities', color: 'oklch(76% 0.1 235)' },
  { id: 'projects', label: 'Student Projects', color: 'oklch(78% 0.09 300)' },
] as const

function IMacScrollWindow({
  id,
  label,
  color,
}: {
  id: string
  label: string
  color: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  })
  const lenis = useLenis()

  // Browsers don't reliably chain a wheel/touch gesture from an exhausted
  // iframe back up to the parent document the way they do for a nested
  // <div>, so without this, hitting the bottom of the embedded section
  // just dead-ends — the outer page's own scrollYProgress never advances
  // again. Once the iframe (same-origin, so this is allowed) is scrolled
  // all the way to a boundary in the gesture's direction, this hands the
  // same delta to this page's own Lenis instance instead — the same API
  // floating-dock.tsx already uses for its anchor links — continuing the
  // shell-shrink/next-window motion exactly like a real user scroll would.
  //
  // (An earlier version tried re-dispatching a synthetic WheelEvent on
  // `window` for Lenis's own listener to pick up — that never actually
  // moved the page, for reasons that weren't worth fully chasing down once
  // the officially-supported `lenis.scrollTo` API was sitting right there.)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !lenis) return

    let detach: (() => void) | undefined

    const attach = () => {
      const win = iframe.contentWindow
      if (!win) return

      const atBoundary = (delta: number) => {
        const doc = win.document.documentElement
        const maxScroll = doc.scrollHeight - win.innerHeight
        return (delta > 0 && win.scrollY >= maxScroll - 2) || (delta < 0 && win.scrollY <= 2)
      }

      const onWheel = (e: WheelEvent) => {
        if (!atBoundary(e.deltaY)) return
        e.preventDefault()
        lenis.scrollTo(lenis.animatedScroll + e.deltaY, { immediate: true })
      }

      // Touch never fires 'wheel' — without its own boundary check, a
      // finger swipe past the end of an open window's content had nowhere
      // to go, since the desktop-only fix above doesn't apply to it.
      let touchY = 0
      const onTouchStart = (e: TouchEvent) => {
        touchY = e.touches[0].clientY
      }
      const onTouchMove = (e: TouchEvent) => {
        const currentY = e.touches[0].clientY
        const delta = touchY - currentY // finger moving up = scrolling down
        touchY = currentY
        if (!atBoundary(delta)) return
        e.preventDefault()
        lenis.scrollTo(lenis.animatedScroll + delta, { immediate: true })
      }

      win.addEventListener('wheel', onWheel, { passive: false })
      win.addEventListener('touchstart', onTouchStart, { passive: true })
      win.addEventListener('touchmove', onTouchMove, { passive: false })
      detach = () => {
        win.removeEventListener('wheel', onWheel)
        win.removeEventListener('touchstart', onTouchStart)
        win.removeEventListener('touchmove', onTouchMove)
      }
    }

    iframe.addEventListener('load', attach)
    return () => {
      iframe.removeEventListener('load', attach)
      detach?.()
    }
  }, [lenis])

  // Symmetric: grow 0 → 0.22, hold full-screen through 0.68, shrink back by
  // 0.9 — a mirror of the same keyframes on the way in and out, so opening
  // and closing feel like the same motion played forwards and backwards.
  //
  // The closed width is always 34vw — height is capped at 34vw/1.4 (never
  // the naive 34vh) so the shell can't grow taller than it is wide. Plain
  // 34vh read fine on a landscape desktop, but on anything narrower than
  // it is tall (a laptop at moderate width, a phone) it produced a
  // portrait "iMac" — no real iMac is portrait, so that broke the
  // silhouette the whole effect depends on reading as. The full-screen
  // state stays exactly 100vw/100vh — that one's meant to fill the
  // viewport, not preserve any particular shape. Every keyframe keeps the
  // same `min(Xvh, Yvw)` shape (500vw at the open keyframes just never
  // binds, for any real viewport) because framer-motion interpolates a
  // complex CSS value by lerping the numbers inside a shared template —
  // keyframes with different templates (some wrapped in min(), some not)
  // don't interpolate cleanly.
  const shellWidth = useTransform(scrollYProgress, [0, 0.22, 0.68, 0.9], ['34vw', '100vw', '100vw', '34vw'])
  const shellHeight = useTransform(
    scrollYProgress,
    [0, 0.22, 0.68, 0.9],
    ['min(34vh, 24.29vw)', 'min(100vh, 500vw)', 'min(100vh, 500vw)', 'min(34vh, 24.29vw)']
  )
  const shellRadius = useTransform(scrollYProgress, [0, 0.22, 0.68, 0.9], [18, 0, 0, 18])
  const bezelPad = useTransform(scrollYProgress, [0, 0.22, 0.68, 0.9], ['6px', '0px', '0px', '6px'])
  const chinHeight = useTransform(scrollYProgress, [0, 0.22, 0.68, 0.9], ['16px', '0px', '0px', '16px'])
  const notchOpacity = useTransform(scrollYProgress, [0, 0.15, 0.75, 0.9], [1, 0, 0, 1])
  const standOpacity = useTransform(scrollYProgress, [0, 0.1, 0.82, 0.92], [1, 0, 0, 1])
  const contentOpacity = useTransform(scrollYProgress, [0.24, 0.32, 0.6, 0.68], [0, 1, 1, 0])
  // Wheel/touch input only reaches the iframe once it's actually visible —
  // otherwise scrolling past a still-small, still-closed iMac would get
  // captured by its (currently offscreen-content) iframe instead of
  // advancing the page.
  const iframePointerEvents = useTransform(contentOpacity, (v) => (v > 0.5 ? 'auto' : 'none'))

  return (
    <div ref={wrapperRef} className="imac-reveal" id={id} style={{ '--imac-color': color } as CSSProperties}>
      <div className="imac-reveal-sticky">
        <motion.div className="imac-stand" style={{ opacity: standOpacity }}>
          <div className="imac-stand-neck" />
          <div className="imac-stand-foot" />
        </motion.div>

        <motion.div
          className="imac-shell"
          style={{ width: shellWidth, height: shellHeight, borderRadius: shellRadius, padding: bezelPad }}
        >
          <motion.div className="imac-shell-notch" style={{ opacity: notchOpacity }} />

          <div className="imac-shell-screen">
            <div className="imac-screen-wallpaper" />

            <motion.div className="imac-reveal-content" style={{ opacity: contentOpacity }}>
              <div className="imac-browser-chrome">
                <div className="imac-traffic-lights">
                  <span className="imac-traffic-light imac-traffic-light--red" />
                  <span className="imac-traffic-light imac-traffic-light--yellow" />
                  <span className="imac-traffic-light imac-traffic-light--green" />
                </div>
                <div className="imac-address-pill">applecentre.rit.edu/#{id}</div>
              </div>
              <div className="imac-reveal-iframe-wrap">
                <motion.iframe
                  ref={iframeRef}
                  src={`/?embed=1&section=${id}`}
                  title={`Apple Centre — ${label}`}
                  className="imac-reveal-iframe"
                  style={{ pointerEvents: iframePointerEvents }}
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>

          <motion.div className="imac-shell-chin" style={{ height: chinHeight }} />
        </motion.div>
      </div>
    </div>
  )
}

export function IMacScrollWindows() {
  return (
    <div className="relative">
      {/* Sticky, not fixed: this needs to keep pace behind all three
          windows' combined runway and then scroll away for good once the
          last one (Student Projects) ends — a fixed layer would just keep
          following forever, all the way down through every section after
          it. The margin-bottom: -100vh trick (see globals.css) is what
          lets a sticky element sit *behind* the siblings that follow it in
          normal flow instead of pushing them down by its own height.
          .imac-reveal-sticky's own background is transparent specifically
          so this shows through around each small/closing shell. */}
      <div className="imac-scroll-marquee-layer">
        <IMacMarqueeField />
      </div>
      {WINDOWS.map((w) => (
        <IMacScrollWindow key={w.id} id={w.id} label={w.label} color={w.color} />
      ))}
    </div>
  )
}
