import * as React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

interface SecondaryButtonProps extends ButtonProps {
  variant?: "outline" | "ghost"
}

const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ className, variant = "outline", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          variant === "outline" && "border-2 border-crimson text-crimson hover:bg-crimson/10",
          variant === "ghost" && "text-crimson hover:bg-crimson/10",
          className
        )}
        {...props}
      />
    )
  }
)
SecondaryButton.displayName = "SecondaryButton"

export { SecondaryButton }

