import { ThreeDMarquee } from '@/components/ui/3d-marquee'
import { MotionLink } from '@/components/patterns/motion-link'
import { buttonVariants } from '@/components/ui/button'

// Real Centre photography (see content/centre-space.ts), repeated to fill
// the 4-column grid the marquee expects — not the 30 unrelated Aceternity
// placeholder screenshots from the original demo. Sits as its own section
// near the CTA band, not inside Hero — Hero already has its own iMac
// marquee background and hands off into the iMac scroll windows
// (imac-scroll-windows.tsx), which this doesn't touch.
const PHOTOS = [
  '/centre-space/entrance-sign.jpg',
  '/centre-space/lab-wide.jpg',
  '/centre-space/imac-back.jpg',
  '/centre-space/magic-mouse.jpg',
  '/centre-space/magic-keyboard.jpg',
  '/centre-space/lab-angle-1.jpg',
  '/centre-space/lab-angle-2.jpg',
  '/centre-space/imac-front.jpg',
]
const MARQUEE_IMAGES = [...PHOTOS, ...PHOTOS, ...PHOTOS, ...PHOTOS]

export function PhotoWallSection() {
  return (
    // my-10 (from the original demo) left a gap above and below where this
    // sits between FacultySection and CtaBand — with no background of its
    // own, that gap showed the sitewide wave-field bleeding through as a
    // visible seam. Flush top/bottom like every other section on this page.
    <section className="relative mx-auto flex h-screen w-full max-w-7xl flex-col items-center justify-center overflow-hidden rounded-3xl">
      <h2 className="relative z-20 mx-auto max-w-4xl text-center text-2xl font-bold text-balance text-white md:text-4xl lg:text-6xl">
        Built here, by students who started{' '}
        <span className="relative z-20 inline-block rounded-xl bg-accent/40 px-4 py-1 text-white underline decoration-accent decoration-[6px] underline-offset-[16px] backdrop-blur-sm">
          exactly
        </span>{' '}
        where you are.
      </h2>
      <p className="relative z-20 mx-auto max-w-2xl py-8 text-center text-sm text-neutral-200 md:text-base">
        No prior Apple platform experience required — just curiosity, and a willingness to build. Every
        workstation you see here is one you can sit down at.
      </p>

      <div className="relative z-20 flex flex-wrap items-center justify-center gap-4 pt-4">
        <MotionLink
          href="/apply"
          className={buttonVariants({ size: 'lg' })}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          Apply Now
        </MotionLink>
        <MotionLink
          href="/programs"
          className="rounded-md border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          Explore Programs
        </MotionLink>
      </div>

      <div className="absolute inset-0 z-10 h-full w-full bg-black/80" />
      <ThreeDMarquee className="pointer-events-none absolute inset-0 h-full w-full" images={MARQUEE_IMAGES} />
    </section>
  )
}
