import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@shared/lib/utils"
import * as React from "react"

function Input({
  className,
  type,
  ...props
}: InputPrimitive.Props & React.RefAttributes<HTMLInputElement>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-11 w-full min-w-0 rounded-xs border bg-card px-3 py-1 text-base sm:text-sm transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary-ink focus-visible:ring-1 focus-visible:ring-primary-ink",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className as string | undefined,
      )}
      {...props}
    />
  )
}

export { Input }
