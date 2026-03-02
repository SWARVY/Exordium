import { REACTION_EMOJIS } from "@entities/reaction"
import { useT } from "@shared/i18n"
import { cn } from "@shared/lib/utils"
import { SmilePlusIcon } from "lucide-react"
import { useRef, useState } from "react"

import type { ReactionEmoji, ReactionSummary } from "@entities/reaction"

interface ReactionPopoverProps {
  summary: ReactionSummary
  onToggle?: (emoji: ReactionEmoji) => void
  disabled?: boolean
  size?: "sm" | "md"
}

export function ReactionPopover({
  summary,
  onToggle,
  disabled,
  size = "sm",
}: ReactionPopoverProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }

  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 120)
  }

  const hoverProps = disabled
    ? {}
    : {
        onMouseEnter: () => {
          cancelClose()
          setOpen(true)
        },
        onMouseLeave: scheduleClose,
      }

  const activeReactions = REACTION_EMOJIS.filter((e) => summary[e].count > 0)

  return (
    <div className="relative flex flex-wrap items-center gap-1.5" {...hoverProps}>
      {/* count > 0 인 반응만 인라인 표시 */}
      {activeReactions.map((emoji) => {
        const { count, reacted } = summary[emoji]
        return (
          <button
            key={emoji}
            type="button"
            disabled={disabled}
            onClick={() => onToggle?.(emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full border transition-all duration-150",
              size === "sm" ? "h-6 px-2" : "h-7 px-3",
              reacted
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5",
              disabled && "cursor-default",
            )}
            aria-pressed={reacted}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span
              key={count}
              className={cn(
                "animate-count-pop font-mono leading-none tabular-nums text-[10px]",
                reacted ? "text-primary" : "text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        )
      })}

      {/* 트리거 버튼 — 로그인 시에만 표시 */}
      {!disabled && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center justify-center rounded-full border border-border transition-colors",
            "text-muted-foreground hover:border-primary/40 hover:text-primary",
            open && "border-primary/40 bg-primary/5 text-primary",
            size === "sm" ? "size-6" : "size-7",
          )}
          aria-label={t.reaction.addReaction}
          aria-expanded={open}
        >
          <SmilePlusIcon className="size-3" />
        </button>
      )}

      {/* Popover */}
      {open && (
        <>
          {/* 모바일 외부 클릭 닫기용 backdrop */}
          <div
            className="fixed inset-0 z-[9] sm:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-md border border-border bg-card p-1.5 shadow-lg"
            {...hoverProps}
          >
            {REACTION_EMOJIS.map((emoji) => {
              const { count, reacted } = summary[emoji]
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggle?.(emoji)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-sm px-2 py-1.5 transition-colors",
                    reacted ? "bg-primary/10" : "hover:bg-muted",
                  )}
                  aria-pressed={reacted}
                >
                  <span className="text-lg leading-none">{emoji}</span>
                  {count > 0 && (
                    <span
                      key={count}
                      className="animate-count-pop font-mono text-[9px] tabular-nums text-muted-foreground"
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
