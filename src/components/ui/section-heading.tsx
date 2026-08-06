import { cn } from "@/lib/utils"
import { TextEffect } from "@/components/patterns/text-effect"

interface SectionHeadingProps {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  size?: "sm" | "md" | "lg" | "xl"
  gradient?: boolean
  className?: string
  children: string
}

const sizeMap = {
  sm: "text-2xl sm:text-3xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl",
  xl: "text-5xl sm:text-6xl",
}

const gradientClassName = "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"

export function SectionHeading({
  className,
  as = "h2",
  size = "lg",
  gradient = false,
  children,
}: SectionHeadingProps) {
  return (
    <TextEffect
      as={as}
      per="word"
      preset="fade-in-blur"
      triggerOnView
      speedReveal={1.3}
      className={cn(
        "font-bold tracking-tight leading-tight",
        sizeMap[size],
        gradient ? gradientClassName : "text-foreground",
        className
      )}
      segmentWrapperClassName={gradient ? gradientClassName : undefined}
    >
      {children}
    </TextEffect>
  )
}
