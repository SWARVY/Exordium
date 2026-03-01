import { tv, type VariantProps } from "tailwind-variants"

export { tv, type VariantProps }

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}
