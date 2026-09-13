import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { tv, type VariantProps } from "tailwind-variants"

const buttonVariants = tv({
  base: "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xs font-mono text-xs font-semibold tracking-wide transition-[color,background-color,border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 data-[disabled]:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink aria-invalid:border-destructive",
  variants: {
    variant: {
      default:
        "border border-primary-ink bg-primary text-primary-foreground enabled:hover:shadow-[3px_3px_0_var(--primary-ink)] enabled:active:shadow-none",
      destructive:
        "border border-destructive bg-destructive text-destructive-foreground enabled:hover:shadow-[3px_3px_0_var(--destructive)] enabled:active:shadow-none",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary:
        "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
      link: "text-primary-ink underline-offset-4 hover:underline",
    },
    size: {
      default: "min-h-11 px-4 py-2 has-[>svg]:px-3",
      sm: "min-h-11 rounded-xs gap-1.5 px-3 has-[>svg]:px-2.5",
      lg: "min-h-12 rounded-xs px-6 has-[>svg]:px-4",
      icon: "size-11",
      "icon-sm": "size-11",
      "icon-lg": "size-12",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    ref?: React.RefObject<HTMLButtonElement | null>
  }

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size, className: className as string | undefined })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
