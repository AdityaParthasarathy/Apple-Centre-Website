'use client'

import { motion } from 'motion/react'

export function Loader() {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative h-10 w-10">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent border-r-accent"
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-transparent border-b-primary"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </motion.div>
  )
}
