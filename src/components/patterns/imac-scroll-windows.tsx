'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useMotionValue, useTransform, useMotionValueEvent } from 'motion/react'
import { useLenis } from 'lenis/react'
import { IMacMarqueeField } from '@/components/patterns/imac-marquee-field'

// Three iMacs in sequence — About, Labs & Facilities, Student Projects —
// each auto-driven by its own scroll runway instead of a click: as you
// scroll into one, its shell grows and its bezel/chin/stand dissolve until
// the screen fills the viewport and the live embedded section
// (/embed/<id> — its own minimal, pre-built route that renders ONLY that
// one section, not a second copy of the whole site) fades in.
// Once open, the page inside is NOT scrolled by the iframe itself: the iframe
// is made as tall as its whole page and the window's runway is made that much
// longer, so this page's own scroll slides the embedded page up through the
// screen (see `pageShift`), and right after it reaches its bottom the motion
// plays in reverse (content fades, shell shrinks, bezel returns) before the
// next iMac starts growing in turn. No click, no modal, no state of our own:
// purely a function of scroll position.
const WINDOWS = [
  { id: 'about', label: 'About the Centre', color: 'oklch(80% 0.1 150)' },
  { id: 'facilities', label: 'Labs & Facilities', color: 'oklch(76% 0.1 235)' },
  { id: 'projects', label: 'Student Projects', color: 'oklch(78% 0.09 300)' },
] as const

// Why the embedded page never scrolls inside its own frame: an iframe that
// scrolls on its own has to hand the gesture back to this page at its edges, and
// that hand-off is where scrolling used to stall — on phones (iOS sizes `100vh`
// to the tallest the viewport gets, and a swipe that starts inside an iframe
// bounces between the frame and the page, so the window shrank after about one
// screenful) and, with a mouse, whenever the wheel and the frame disagreed
// about who owned the gesture. With the frame as tall as its page there is
// nothing to hand off: this page scrolls, always.
//
// Only with reduced motion is the old plain scrollable frame kept (see the
// prefers-reduced-motion block in globals.css), which needs no help.
function useDrivenLayout() {
  const [driven, setDriven] = useState(false)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setDriven(!reduced.matches)
    update()
    reduced.addEventListener('change', update)
    return () => reduced.removeEventListener('change', update)
  }, [])
  return driven
}

// The browser-chrome strip above the page inside a full-screen window.
const CHROME_PX = 40
// Where the "closed → open" part of the runway ends: the content is fully
// faded in at this fraction (see contentOpacity below).
const HOLD_START = 0.32

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
  const lenis = useLenis()
  const driven = useDrivenLayout()

  // How tall the embedded page is, and
  // so how much extra runway the window needs to scroll all of it through.
  // Kept once measured (even after the iframe unmounts) so the runway never
  // changes length while you scroll past it.
  const [contentHeight, setContentHeight] = useState(0)
  // The viewport height the extra runway is sized for. On a touch screen it is
  // the smallest seen (iOS: toolbars expanded), so `extra` doesn't wobble every
  // time the browser's toolbar slides in or out mid-scroll; with a mouse it is
  // simply the current window height.
  const [minViewport, setMinViewport] = useState(0)
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)')
    let lastWidth = window.innerWidth
    const track = () => {
      const widthChanged = window.innerWidth !== lastWidth
      lastWidth = window.innerWidth
      setMinViewport((prev) =>
        coarse.matches && !widthChanged && prev > 0 ? Math.min(prev, window.innerHeight) : window.innerHeight
      )
    }
    track()
    window.addEventListener('resize', track)
    return () => window.removeEventListener('resize', track)
  }, [])
  const extra =
    driven && contentHeight > 0 && minViewport > 0
      ? Math.max(0, Math.round(contentHeight - (minViewport - CHROME_PX) + 24))
      : 0

  // `scrollYProgress` drives every animation below. It is how far through the
  // runway the page has scrolled, except that the runway is `extra` pixels
  // longer when the embedded page is taller than the screen, and that stretch is
  // spent holding the window open while the page inside slides up
  // (`pageShift`); the progress the animations see stands still through it
  // and resumes afterwards.
  //
  // Computed straight from window.scrollY and a cached position, in the same
  // commit that changes the runway's length (layout effect, not a one-frame-
  // late ResizeObserver) — a stale measurement here showed up as the shell
  // visibly jumping the moment the runway grew.
  const scrollYProgress = useMotionValue(0)
  const pageShift = useMotionValue(0)
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    let top = 0
    let travel = 1

    const update = () => {
      const px = Math.min(travel, Math.max(0, window.scrollY - top))
      if (extra <= 0) {
        scrollYProgress.set(px / travel)
        pageShift.set(0)
        return
      }
      const base = Math.max(1, travel - extra)
      const holdStart = HOLD_START * base
      if (px <= holdStart) {
        scrollYProgress.set(px / base)
        pageShift.set(0)
      } else if (px <= holdStart + extra) {
        scrollYProgress.set(HOLD_START)
        pageShift.set(-(px - holdStart))
      } else {
        scrollYProgress.set((px - extra) / base)
        pageShift.set(-extra)
      }
    }
    const measure = () => {
      top = wrapper.getBoundingClientRect().top + window.scrollY
      travel = Math.max(1, wrapper.offsetHeight - window.innerHeight)
      update()
    }

    measure()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', measure)
    // The window's own size, and the page's: content loading in above it
    // (images, fonts) moves it without the window itself resizing.
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    observer.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [extra, scrollYProgress, pageShift])

  // The embedded page loads BEFORE its window is reached — as soon as the
  // runway is within about a screen of the viewport — rather than part-way
  // through the grow animation. Mounting an iframe (a full separate request,
  // render and hydration) in the middle of the animation is a main-thread
  // hitch you can feel as you scroll in, and a still-loading page shows as a
  // blank screen when the window opens. Loaded early, the page is ready and
  // its height is known, so the runway is already its final
  // length before you arrive.
  const [iframeActive, setIframeActive] = useState(false)
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    // Entries are queued oldest-first: the last one is where things stand now.
    const observer = new IntersectionObserver((entries) => setIframeActive(entries[entries.length - 1].isIntersecting), {
      rootMargin: '120% 0px',
    })
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  // Hide the site's own header and dock only while the window is mostly open
  // (see .imac-window-active in globals.css) — not from the first pixel of
  // growth, when they would blink out in front of a still-small iMac.
  const [chromeHidden, setChromeHidden] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const shouldHide = v > 0.1 && v < 0.8
    setChromeHidden((prev) => (prev === shouldHide ? prev : shouldHide))
  })

  // Track the embedded page's full height so the runway and the iframe can be
  // made exactly that long, and — with a mouse — pass wheel turns made over the
  // frame on to this page's Lenis, which is what actually moves the page (a
  // wheel over an iframe is otherwise delivered to the iframe, not to us).
  // Touch needs nothing: the frame is as tall as its page, so a swipe over it
  // scrolls this page natively.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !driven) return

    let detach: (() => void) | undefined
    const attach = () => {
      detach?.()
      const win = iframe.contentWindow
      const doc = iframe.contentDocument
      if (!win || !doc) return

      // Not 0: a frame that is still blank (or being swapped) must not wipe a
      // height already measured, which would shorten the runway under you.
      const measure = () => {
        const height = Math.ceil(doc.body.offsetHeight)
        if (height > 0) setContentHeight(height)
      }
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(doc.body)

      const onWheel = (e: WheelEvent) => {
        if (!lenis || e.ctrlKey) return // ctrl+wheel is the browser's zoom
        e.preventDefault()
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
        // `targetScroll` (where the eased scroll is heading), not
        // `animatedScroll` (where it has got to): a fast wheel fires many
        // events before one tween ends, and adding to the latter would aim
        // each new turn behind the one already under way.
        lenis.scrollTo(lenis.targetScroll + e.deltaY * unit, {
          programmatic: false,
          lerp: lenis.options.lerp,
          duration: lenis.options.duration,
          easing: lenis.options.easing,
        })
      }
      win.addEventListener('wheel', onWheel, { passive: false })

      detach = () => {
        observer.disconnect()
        win.removeEventListener('wheel', onWheel)
      }
    }

    iframe.addEventListener('load', attach)
    // Already loaded by the time this ran (the frame is mounted early).
    const doc = iframe.contentDocument
    if (doc && doc.readyState === 'complete' && doc.URL !== 'about:blank' && doc.body) attach()
    return () => {
      iframe.removeEventListener('load', attach)
      detach?.()
    }
  }, [lenis, iframeActive, driven])

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
    ['min(34dvh, 24.29vw)', 'min(100dvh, 500vw)', 'min(100dvh, 500vw)', 'min(34dvh, 24.29vw)']
  )
  const shellRadius = useTransform(scrollYProgress, [0, 0.22, 0.68, 0.9], [18, 0, 0, 18])
  const bezelPad = useTransform(scrollYProgress, [0, 0.22, 0.68, 0.9], ['6px', '0px', '0px', '6px'])
  const chinHeight = useTransform(scrollYProgress, [0, 0.22, 0.68, 0.9], ['16px', '0px', '0px', '16px'])
  const notchOpacity = useTransform(scrollYProgress, [0, 0.15, 0.75, 0.9], [1, 0, 0, 1])
  // Previously faded out by 0.1 and back in only by 0.82 — nowhere close to
  // the shell's own 0.22/0.68 grow/shrink finish points, so for most of the
  // actual resize the shell was already a clearly medium-sized rectangle
  // with no stand under it at all, reading as a glitch rather than part of
  // the motion. Tracking the same schedule as the shell's own size keeps it
  // visible for the whole grow/shrink, only fading right at each end where
  // a stand under a fullscreen "browser window" wouldn't make sense anyway.
  const standOpacity = useTransform(scrollYProgress, [0, 0.2, 0.7, 0.9], [1, 0, 0, 1])
  // The stand's vertical position is half the shell's CURRENT height, not
  // just its closed-state height — it used to be a static CSS value
  // (half of the closed formula only), which was fine while standOpacity
  // hid it almost immediately, but now that it stays visible through most
  // of the resize, a fixed offset would drift away from the shell's actual
  // (growing) bottom edge. Mirrors shellHeight's own keyframes exactly,
  // just halved, so it tracks the real edge at every point in between.
  const standTop = useTransform(
    scrollYProgress,
    [0, 0.22, 0.68, 0.9],
    [
      'calc(50% + min(17dvh, 12.145vw))',
      'calc(50% + min(50dvh, 250vw))',
      'calc(50% + min(50dvh, 250vw))',
      'calc(50% + min(17dvh, 12.145vw))',
    ]
  )
  const contentOpacity = useTransform(scrollYProgress, [0.24, 0.32, 0.6, 0.68], [0, 1, 1, 0])
  // Wheel/touch input only reaches the iframe once it's actually visible —
  // otherwise scrolling past a still-small, still-closed iMac would get
  // captured by its (currently offscreen-content) iframe instead of
  // advancing the page.
  const iframePointerEvents = useTransform(contentOpacity, (v) => (v > 0.5 ? 'auto' : 'none'))

  return (
    <div
      ref={wrapperRef}
      className="imac-reveal"
      id={id}
      style={
        {
          '--imac-color': color,
          ...(extra > 0 && { height: `calc(260vh + ${extra}px)`, containIntrinsicSize: `auto calc(260vh + ${extra}px)` }),
        } as CSSProperties
      }
    >
      {chromeHidden && <div className="imac-window-active" hidden />}
      <div className="imac-reveal-sticky">
        <motion.div className="imac-stand" style={{ opacity: standOpacity, top: standTop }}>
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
                {iframeActive && (
                  <motion.iframe
                    ref={iframeRef}
                    src={`/embed/${id}`}
                    title={`Apple Centre — ${label}`}
                    className="imac-reveal-iframe"
                    style={{
                      pointerEvents: iframePointerEvents,
                      ...(driven && { height: contentHeight || undefined, minHeight: '100dvh', y: pageShift }),
                    }}
                  />
                )}
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
