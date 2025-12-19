import * as React from "react"
import { Input } from "./input"
import { Label } from "./label"
import { cn } from "@/lib/utils"

interface TextFieldProps extends React.ComponentProps<"input"> {
  label: string
  error?: string
  containerClassName?: string
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, containerClassName, className, id, ...props }, ref) => {
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    
    return (
      <div className={cn("space-y-2", containerClassName)}>
        <Label htmlFor={inputId} className="text-midnight-navy">
          {label}
        </Label>
        <Input
          id={inputId}
          ref={ref as any}
          className={cn(
            "text-midnight-navy",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)
TextField.displayName = "TextField"

export { TextField }

