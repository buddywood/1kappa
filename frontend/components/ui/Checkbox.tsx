import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  containerClassName?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, containerClassName, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${label?.toLowerCase().replace(/\s+/g, '-') || 'default'}`
    
    return (
      <div className={cn("flex items-center gap-2", containerClassName)}>
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={cn(
            "rounded border-frost-gray text-crimson focus:ring-crimson w-4 h-4 cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm text-midnight-navy/70 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

