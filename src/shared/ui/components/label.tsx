import { cn } from "@shared/lib/utils"
import * as React from "react"

function Label({ className, htmlFor, children, ...props }: React.ComponentProps<"label">) {
  return (
    // Callers supply htmlFor or wrap a control; the primitive forwards both explicitly.
    <label
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50  peer-[[data-disabled]]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  )
}

export { Label }
