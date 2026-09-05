'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder'
import { isExternalImage } from '@/lib/utils'

export interface AnimatedTestimonial {
  quote: string
  name: string
  designation: string
  src?: string
}

interface AnimatedTestimonialsProps {
  testimonials: AnimatedTestimonial[]
  autoplay?: boolean
}

// Deterministic per-card tilt, keyed by index — avoids the hydration
// mismatch a Math.random() call would cause (server and client would pick
// different values on the same render).
const ROTATIONS = [-8, -5, 3, 6, -3, 8]

export function AnimatedTestimonials({ testimonials, autoplay = false }: AnimatedTestimonialsProps) {
  const [active, setActive] = useState(0)

  const handleNext = () => setActive((prev) => (prev + 1) % testimonials.length)
  const handlePrev = () => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  const isActive = (index: number) => index === active

  useEffect(() => {
    if (!autoplay) return
    const interval = setInterval(handleNext, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay])

  // testimonials comes from a live external sheet (see faculty-client.tsx)
  // — an empty result is a real, if rare, state (a slow/failed fetch, no
  // rows yet), not something that can't happen. Without this guard,
  // `current` below is undefined and `current.name` throws — which,
  // because this is a Server Component tree, doesn't just break this
  // section, it crashes the entire homepage with a 500.
  if (testimonials.length === 0) {
    return <p className="text-sm text-muted-foreground">Team profiles are on their way.</p>
  }

  const current = testimonials[active]

  return (
    <div className="mx-auto max-w-sm px-4 py-8 sm:max-w-4xl sm:px-8">
      <div className="relative grid grid-cols-1 gap-16 md:grid-cols-2">
        <div className="relative h-80 w-full">
          <AnimatePresence>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.9, rotate: ROTATIONS[index % ROTATIONS.length] }}
                animate={{
                  opacity: isActive(index) ? 1 : 0.5,
                  scale: isActive(index) ? 1 : 0.95,
                  rotate: isActive(index) ? 0 : ROTATIONS[index % ROTATIONS.length],
                  zIndex: isActive(index) ? 10 : testimonials.length + 2 - index,
                  y: isActive(index) ? [0, -32, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, rotate: ROTATIONS[index % ROTATIONS.length] }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute inset-0 origin-bottom"
              >
                {testimonial.src ? (
                  <Image
                    src={testimonial.src}
                    alt={testimonial.name}
                    fill
                    draggable={false}
                    className="rounded-3xl object-cover object-center"
                    sizes="(max-width: 768px) 90vw, 400px"
                    unoptimized={isExternalImage(testimonial.src)}
                  />
                ) : (
                  <AvatarPlaceholder name={testimonial.name} size="lg" className="h-full w-full rounded-3xl" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-between py-4">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <h3 className="text-2xl font-bold text-foreground">{current.name}</h3>
            <p className="text-sm text-accent">{current.designation}</p>
            <p className="mt-8 text-lg text-muted-foreground">
              {current.quote.split(' ').map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ filter: 'blur(10px)', opacity: 0, y: 5 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut', delay: 0.02 * index }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </p>
          </motion.div>

          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
