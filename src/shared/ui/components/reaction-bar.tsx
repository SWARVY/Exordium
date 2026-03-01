import { useT } from "@shared/i18n"
import { cn } from "@shared/lib/utils"
import { REACTION_EMOJIS } from "@entities/reaction"

import type { ReactionEmoji, ReactionSummary } from "@entities/reaction"

interface ReactionBarProps {
  summary: ReactionSummary
  onToggle?: (emoji: ReactionEmoji) => void
  disabled?: boolean
  size?: "sm" | "md"
  centered?: boolean
}

export function ReactionBar({ summary, onToggle, disabled, size = "md", centered = false }: ReactionBarProps) {
  const t = useT()

  return (
    <div className={cn("flex flex-wrap gap-2", centered && "justify-center")}>
      {REACTION_EMOJIS.map((emoji) => {
        const { count, reacted } = summary[emoji]
        const isActive = reacted

        return (
          <button
            key={emoji}
            type="button"
            disabled={disabled}
            onClick={() => onToggle?.(emoji)}
            className={cn(
              "group flex items-center gap-1.5 rounded-full border transition-all duration-150",
              size === "sm"
                ? "px-2 py-0.5"
                : "px-3 py-1.5",
              isActive
                ? "border-primary/40 bg-primary/8 shadow-[inset_0_0_0_1px_var(--color-primary)/20]"
                : "border-border bg-card hover:border-primary/30 hover:bg-primary/5",
              disabled && "cursor-default",
            )}
            aria-pressed={isActive}
            title={disabled ? t.reaction.loginRequired : undefined}
          >
            <span className={cn(
              "leading-none transition-transform duration-150",
              size === "sm" ? "text-sm" : "text-base",
              !disabled && "group-hover:scale-110",
            )}>
              {emoji}
            </span>
            {count > 0 && (
              <span className={cn(
                "font-mono leading-none tabular-nums transition-colors",
                size === "sm" ? "text-[10px]" : "text-[11px]",
                isActive ? "text-primary" : "text-muted-foreground",
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
