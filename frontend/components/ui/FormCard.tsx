import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card"
import { cn } from "@/lib/utils"

interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  variant?: "default" | "elevated" | "bordered"
}

const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  ({ title, description, variant = "default", className, children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-white shadow-lg",
      elevated: "bg-white shadow-xl",
      bordered: "bg-white border-2 border-frost-gray",
    }

    return (
      <Card
        ref={ref}
        className={cn(
          "rounded-xl",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle className="text-midnight-navy">{title}</CardTitle>}
            {description && (
              <CardDescription className="text-midnight-navy/70">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent className={title || description ? undefined : "p-6"}>
          {children}
        </CardContent>
      </Card>
    )
  }
)
FormCard.displayName = "FormCard"

export { FormCard }

