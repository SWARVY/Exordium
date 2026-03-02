import { tv, type VariantProps } from "tailwind-variants"

export { tv, type VariantProps }

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "Mar 1, 2026" — SSR/CSR 동일 결과 보장 */
export function formatDate(isoString: string): string {
  const [datePart] = isoString.split("T")
  const [y, m, d] = (datePart ?? isoString).split("-").map(Number)
  return `${MONTHS_SHORT[(m ?? 1) - 1]} ${d}, ${y}`
}

/** "Mar 1" — 댓글/답글 짧은 날짜용 */
export function formatShortDate(isoString: string): string {
  const [datePart] = isoString.split("T")
  const [, m, d] = (datePart ?? isoString).split("-").map(Number)
  return `${MONTHS_SHORT[(m ?? 1) - 1]} ${d}`
}
