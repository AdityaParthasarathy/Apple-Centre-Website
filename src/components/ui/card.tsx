import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Component = "div", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        // Liquid Glass: translucent enough that the wave field behind it
        // (see wave-field.tsx) reads through as a faint tint, blurred
        // enough that it stays frosted rather than showing a legible smear
        // of blob edges. bg-card/70 is the tuned number — high enough that
        // body text keeps contrast, low enough the tint is actually
        // visible. The white border is the "glass edge catching light"
        // cue; the existing header/dock/dropdown glass all use the neutral
        // border-border instead, which is correct for chrome sitting over
        // arbitrary content but reads flat here.
        "rounded-lg border border-white/40 bg-card/70 text-card-foreground shadow-sm backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:bg-card/80 hover:shadow-lg",
        className
      )}
      {...props}
    />
  )
)

Card.displayName = "Card"

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)

CardHeader.displayName = "CardHeader"

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)

CardFooter.displayName = "CardFooter"

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)

CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)

CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
)

CardContent.displayName = "CardContent"
