import {
  Tooltip,
  TooltipContent,
  TooltipPositioner,
  TooltipTrigger,
} from "@shared/ui/components/tooltip"
import { LoaderCircleIcon, type LucideIcon } from "lucide-react"

export type AuthButtonVariant = "default" | "navigation" | "icon"

interface AuthActionButtonProps {
  variant: AuthButtonVariant
  icon: LucideIcon
  label: string
  pendingLabel: string
  isPending: boolean
  disabled: boolean
  onClick: () => void
}

const appearance = {
  default:
    "inline-flex min-h-11 items-center justify-center rounded-xs border border-border px-3 py-2 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary-ink disabled:opacity-50",
  navigation:
    "flex min-h-14 w-full flex-col items-center justify-center gap-1 px-2 py-2 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50",
  icon: "flex size-11 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
}

export function AuthActionButton({
  variant,
  icon,
  label,
  pendingLabel,
  isPending,
  disabled,
  onClick,
}: AuthActionButtonProps) {
  const Icon = isPending ? LoaderCircleIcon : icon
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isPending}
      aria-label={label}
      aria-busy={isPending}
      className={appearance[variant]}
    >
      {variant !== "default" && (
        <Icon
          aria-hidden="true"
          className={`${variant === "navigation" ? "size-5" : "size-4"} ${isPending ? "motion-safe:animate-spin" : ""}`}
        />
      )}
      {variant !== "icon" && (
        <span className="max-w-full [overflow-wrap:anywhere]">
          {isPending ? pendingLabel : label}
        </span>
      )}
    </button>
  )

  if (variant !== "icon") return button

  return (
    <Tooltip>
      <TooltipTrigger render={button} disabled={disabled || isPending} />
      <TooltipPositioner side="bottom" align="end">
        <TooltipContent className="font-mono">{label}</TooltipContent>
      </TooltipPositioner>
    </Tooltip>
  )
}
