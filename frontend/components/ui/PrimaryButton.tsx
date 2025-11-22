import * as React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface PrimaryButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, loading, loadingText, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "w-full bg-crimson text-white hover:bg-crimson/90",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)
PrimaryButton.displayName = "PrimaryButton"

export { PrimaryButton }

