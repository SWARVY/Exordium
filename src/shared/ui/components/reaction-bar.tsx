import { ToggleGroup } from "@base-ui/react/toggle-group"
import { REACTION_EMOJIS } from "@entities/reaction"
import { useT } from "@shared/i18n"
import { useCallback, useMemo } from "react"

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
  const selected = useMemo(
    () => REACTION_EMOJIS.filter((emoji) => summary[emoji].reacted),
    [summary],
  )
  const handleValueChange = useCallback(
    (values: string[]) => {
      const changed = REACTION_EMOJIS.find(
        (emoji) => values.includes(emoji) !== summary[emoji].reacted,
      )
      if (changed) onToggle?.(changed)
    },
    [summary, onToggle],
  )

  return (
    <ToggleGroup
      multiple
      value={selected}
      disabled={disabled}
      aria-label={label ?? t.reaction.label}
      onValueChange={handleValueChange}
      className="flex w-fit max-w-full flex-wrap items-center gap-1"
    >
      {REACTION_EMOJIS.map((emoji) => (
        <ReactionButton key={emoji} emoji={emoji} count={summary[emoji].count} />
      ))}
    </ToggleGroup>
  )
}
