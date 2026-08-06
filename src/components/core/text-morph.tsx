'use client'

import { AnimatePresence, motion, type Transition, type TargetAndTransition } from 'motion/react'
import { useId, useMemo } from 'react'

const MOTION_TAGS = {
  p: motion.create('p'),
  span: motion.create('span'),
  div: motion.create('div'),
  h1: motion.create('h1'),
  h2: motion.create('h2'),
  h3: motion.create('h3'),
} as const

type MorphTag = keyof typeof MOTION_TAGS

export type TextMorphProps = {
  children: string
  as?: MorphTag
  className?: string
  style?: React.CSSProperties
  variants?: {
    initial: TargetAndTransition
    animate: TargetAndTransition
    exit: TargetAndTransition
  }
  transition?: Transition
}

export function TextMorph({
  children,
  as = 'span',
  className,
  style,
  variants,
  transition,
}: TextMorphProps) {
  const uniqueId = useId()

  const characters = useMemo(() => {
    const charCounts: Record<string, number> = {}

    return children.split('').map((char) => {
      const lowerChar = char.toLowerCase()
      charCounts[lowerChar] = (charCounts[lowerChar] || 0) + 1

      return {
        id: `${uniqueId}-${lowerChar}${charCounts[lowerChar]}`,
        label: char === ' ' ? ' ' : char,
      }
    })
  }, [children, uniqueId])

  const defaultVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const defaultTransition: Transition = {
    type: 'spring',
    stiffness: 280,
    damping: 18,
    mass: 0.3,
  }

  const MotionComponent = MOTION_TAGS[as]

  return (
    <MotionComponent
      className={className}
      style={style}
      layout
      transition={transition ?? defaultTransition}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {characters.map((character) => (
          <motion.span
            key={character.id}
            layoutId={character.id}
            className="inline-block"
            aria-hidden="true"
            initial={variants?.initial ?? defaultVariants.initial}
            animate={variants?.animate ?? defaultVariants.animate}
            exit={variants?.exit ?? defaultVariants.exit}
            transition={transition ?? defaultTransition}
          >
            {character.label}
          </motion.span>
        ))}
      </AnimatePresence>
      <span className="sr-only">{children}</span>
    </MotionComponent>
  )
}
