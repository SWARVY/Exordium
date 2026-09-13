import { REACTION_EMOJIS } from "@entities/reaction"
import { useT } from "@shared/i18n"
import { SmilePlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "./button"
import { Popover, PopoverContent, PopoverPositioner, PopoverTitle, PopoverTrigger } from "./popover"
import { ReactionBar } from "./reaction-bar"
import { ReactionButton } from "./reaction-button"

import type { ReactionEmoji, ReactionSummary } from "@entities/reaction"

interface ReactionPopoverProps {
  summary: ReactionSummary
  onToggle?: (emoji: ReactionEmoji) => void
  disabled?: boolean
}

export function ReactionPopover({ summary, onToggle, disabled }: ReactionPopoverProps) {
  const t = useT()
  const [open, setOpen] = useState(false)

  function selectReaction(emoji: ReactionEmoji) {
    onToggle?.(emoji)
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTION_EMOJIS.filter((emoji) => summary[emoji].count > 0).map((emoji) => (
        <ReactionButton
          key={emoji}
          emoji={emoji}
          count={summary[emoji].count}
          reacted={summary[emoji].reacted}
          disabled={disabled}
          onToggle={onToggle}
        />
      ))}
      {onToggle && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="reaction-trigger hover:bg-transparent"
                focusableWhenDisabled
              />
            }
            disabled={disabled}
            aria-label={t.reaction.addReaction}
          >
            <span className="reaction-chip size-7" aria-hidden="true">
              <SmilePlusIcon className="size-3.5" />
            </span>
          </PopoverTrigger>
          <PopoverPositioner side="top" align="start" sideOffset={8} collisionPadding={16}>
            <PopoverContent className="w-fit p-2">
              <PopoverTitle className="sr-only">{t.reaction.addReaction}</PopoverTitle>
              <ReactionBar
                summary={summary}
                disabled={disabled}
                label={t.reaction.addReaction}
                onToggle={selectReaction}
              />
            </PopoverContent>
          </PopoverPositioner>
        </Popover>
      )}
    </div>
  )
}
