import { useT } from "@shared/i18n"
import { useId } from "react"

import { Toggle } from "./toggle"

import type { ReactionEmoji } from "@entities/reaction"

interface ReactionButtonProps {
  emoji: ReactionEmoji
  count: number
  reacted?: boolean
  disabled?: boolean
  onToggle?: (emoji: ReactionEmoji) => void
}

export function ReactionButton({ emoji, count, reacted, disabled, onToggle }: ReactionButtonProps) {
  const t = useT()
  const countId = useId()

  function handlePressedChange() {
    onToggle?.(emoji)
  }

  return (
    <Toggle
      variant="reaction"
      size="compact"
      value={emoji}
      pressed={reacted}
      disabled={disabled}
      onPressedChange={onToggle ? handlePressedChange : undefined}
      aria-label={emoji}
      aria-describedby={countId}
    >
      <span aria-hidden="true" data-slot="reaction-chip" className="reaction-chip">
        <span className="text-sm leading-none">{emoji}</span>
        <span className="type-meta min-w-[2ch] text-center font-mono tabular-nums">{count}</span>
      </span>
      <span id={countId} className="sr-only">
        {t.reaction.count(count)}
      </span>
    </Toggle>
  )
}
