'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface FlipWordsProps {
  words: string[]
  duration?: number
  className?: string
}

const FADE_MS = 700
// Smooth ease-in-out — gentle acceleration and deceleration on both the
// fade-out and fade-in, rather than the snappier default 'ease-out'.
const FADE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

export function FlipWords({ words, duration = 3000, className = '' }: FlipWordsProps) {
  const [index, setIndex] = useState(0)
  // Controls the opacity of the single visible word below. The word's text
  // only ever changes while this is false (i.e. fully transparent), so
  // there's never a moment where two different words are both partially
  // visible and overlapping — old one fades out completely, then the new
  // one fades in.
  const [visible, setVisible] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  const wordsRef = useRef(words)
  useEffect(() => {
    wordsRef.current = words
  }, [words])

  useEffect(() => {
    if (prefersReducedMotion) return

    const timer = setInterval(() => {
      setVisible(false)
    }, duration)

    return () => clearInterval(timer)
  }, [duration, prefersReducedMotion])

  useEffect(() => {
    if (visible) return

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % wordsRef.current.length)
      setVisible(true)
    }, FADE_MS)

    return () => clearTimeout(timer)
  }, [visible])

  if (prefersReducedMotion) {
    return <span className={className}>{words[words.length - 1]}</span>
  }

  return (
    <span className={`relative inline-grid text-center align-baseline ${className}`}>
      {/* Invisible sizers reserve the box's width to whichever word renders
          widest, so the sentence around it never reflows as the word
          cycles — the same box, every time, regardless of word length. */}
      {words.map((word) => (
        <span
          key={word}
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 block"
        >
          {word}
        </span>
      ))}

      {/* Deliberately only ever animates opacity + transform here, never
          filter (blur). Those two are the only properties Chromium can
          animate purely on the compositor thread — a `filter` transition
          needs a main-thread repaint on every frame, and if the main thread
          is busy at all during that window Chromium can end up painting
          zero intermediate frames and jumping straight to the end state
          (which is exactly what this looked like: the transition timeline
          itself ticked correctly, but nothing got painted until it was
          already done). Firefox doesn't have that same main-thread
          dependency for filters, which is why this only ever looked smooth
          there. A subtle scale stands in for the blur's "materializing"
          feel without touching filter at all. */}
      <span
        aria-live="polite"
        className="col-start-1 row-start-1 block text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.97)',
          transition: `opacity ${FADE_MS}ms ${FADE_EASE}, transform ${FADE_MS}ms ${FADE_EASE}`,
          willChange: 'opacity, transform',
        }}
      >
        {words[index]}
      </span>
    </span>
  )
}
