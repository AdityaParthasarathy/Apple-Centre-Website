'use client'

import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

interface AnnouncementBadgeProps {
  text: string
  href?: string
  variant?: 'default' | 'secondary' | 'accent'
}

export function AnnouncementBadge({ text, href, variant = 'secondary' }: AnnouncementBadgeProps) {
  const Wrapper = href ? 'a' : 'div'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center"
    >
      <Wrapper
        {...(href && { href, className: 'cursor-pointer' })}
        className={href ? 'group' : ''}
      >
        <Badge variant={variant} className="gap-2 px-4 py-2 text-xs sm:text-sm">
          <span>{text}</span>
          {href && (
            <motion.div
              className="group-hover:translate-x-1 transition-transform"
              whileHover={{ x: 2 }}
            >
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </motion.div>
          )}
        </Badge>
      </Wrapper>
    </motion.div>
  )
}
