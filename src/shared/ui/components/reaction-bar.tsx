import { ToggleGroup } from "@base-ui/react/toggle-group"
import { REACTION_EMOJIS } from "@entities/reaction"
import { useT } from "@shared/i18n"

import { ReactionButton } from "./reaction-button"

import type { ReactionEmoji, ReactionSummary } from "@entities/reaction"

interface ReactionBarProps {
  summary: ReactionSummary
  onToggle?: (emoji: ReactionEmoji) => void
  disabled?: boolean
  label?: string
}

export function ReactionBar({ summary, onToggle, disabled, label }: ReactionBarProps) {
  const t = useT()
  const selected = REACTION_EMOJIS.filter((emoji) => summary[emoji].reacted)

  return (
    <ToggleGroup
      multiple
      value={selected}
      disabled={disabled}
      aria-label={label ?? t.reaction.label}
      onValueChange={(values) => {
        const changed = REACTION_EMOJIS.find(
          (emoji) => values.includes(emoji) !== summary[emoji].reacted,
        )
        if (changed) onToggle?.(changed)
      }}
      className="flex w-fit max-w-full flex-wrap items-center gap-1"
    >
      {REACTION_EMOJIS.map((emoji) => (
        <ReactionButton key={emoji} emoji={emoji} count={summary[emoji].count} />
      ))}
    </ToggleGroup>
  )
}
