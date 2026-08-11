import { cn } from "@/lib/utils"
import { TextEffect } from "@/components/patterns/text-effect"

interface SectionHeadingProps {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  children: string
}

const sizeMap = {
  sm: "text-2xl sm:text-3xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl",
  xl: "text-5xl sm:text-6xl",
}

export function SectionHeading({
  className,
  as = "h2",
  size = "lg",
  children,
}: SectionHeadingProps) {
  return (
    <TextEffect
      as={as}
      per="word"
      preset="fade-in-blur"
      triggerOnView
      speedReveal={1.3}
      className={cn("font-black tracking-tight leading-tight text-foreground", sizeMap[size], className)}
    >
      {children}
    </TextEffect>
  )
}
