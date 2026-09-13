import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { tv, type VariantProps } from "tailwind-variants"

const toggleVariants = tv({
  base: "inline-flex items-center justify-center rounded-xs text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[disabled]:pointer-events-none data-[disabled]:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      default:
        "bg-transparent hover:bg-accent data-[pressed]:bg-accent data-[pressed]:text-accent-foreground",
      outline:
        "border border-input bg-card hover:bg-accent data-[pressed]:bg-accent data-[pressed]:text-accent-foreground",
      reaction: "reaction-trigger bg-transparent text-muted-foreground data-[disabled]:opacity-100",
    },
    size: {
      default: "min-h-11 min-w-11 gap-2 px-3 py-2",
      compact: "min-h-11 min-w-11 px-0 py-1",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})

function Toggle({
  className,
  variant,
  size,
  render = <ButtonPrimitive focusableWhenDisabled />,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      render={render}
      className={toggleVariants({ variant, size, className: className as string | undefined })}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
