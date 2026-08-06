import { buttonVariants } from '@/components/ui/button'
import { MotionLink } from '@/components/patterns/motion-link'

export function ApplyNowButton() {
  return (
    <MotionLink
      href="/apply"
      className={buttonVariants({ size: 'sm', variant: 'outline' })}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      Apply Now
    </MotionLink>
  )
}
