import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
}

const sizeMap = {
  sm: "max-w-[28rem]",
  md: "max-w-[32rem]",
  lg: "max-w-[48rem]",
  xl: "max-w-[64rem]",
  "2xl": "max-w-[80rem]",
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "2xl", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}
      {...props}
    />
  )
)

Container.displayName = "Container"
