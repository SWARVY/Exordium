import { reactionQueryOptions } from "@entities/reaction"
import { useToggleCommentReaction } from "@features/toggle-reaction"
import { useT } from "@shared/i18n"
import { ReactionPopover } from "@shared/ui/components/reaction-popover"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useRef } from "react"

import type { ReactionEmoji } from "@entities/reaction"

interface CommentReactionsProps {
  commentId: string
  userId?: string
}

export function CommentReactions({ commentId, userId }: CommentReactionsProps) {
  const toggleLockRef = useRef(false)
  const t = useT()
  const reactionQuery = useQuery(reactionQueryOptions.byComment(commentId, userId))
  const { refetch: refetchReactions } = reactionQuery
  const toggleMutation = useToggleCommentReaction(commentId, userId)
  const { mutate: toggle } = toggleMutation

  const handleToggle = useCallback(
    (variables: { emoji: ReactionEmoji; reacted: boolean }) => {
      if (toggleLockRef.current) return
      toggleLockRef.current = true
      toggle(variables, {
        onSettled: () => {
          toggleLockRef.current = false
        },
      })
    },
    [toggle],
  )

  const handleReactionToggle = useCallback(
    (emoji: ReactionEmoji) => {
      if (!reactionQuery.data) return
      handleToggle({ emoji, reacted: reactionQuery.data[emoji].reacted })
    },
    [handleToggle, reactionQuery.data],
  )

  const retryReactions = useCallback(() => void refetchReactions(), [refetchReactions])

  const retryToggle = useCallback(() => {
    if (toggleMutation.variables) handleToggle(toggleMutation.variables)
  }, [handleToggle, toggleMutation.variables])

  if (reactionQuery.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">{t.community.reactionsLoadFailed}</p>
        <button
          type="button"
          onClick={retryReactions}
          disabled={reactionQuery.isFetching}
          className="min-h-11 px-1 font-mono text-xs font-semibold uppercase tracking-wider text-foreground underline underline-offset-4 disabled:opacity-50"
        >
          {reactionQuery.isFetching ? t.action.loading : t.action.retry}
        </button>
      </div>
    )
  }

  if (!reactionQuery.data) return null

  return (
    <div className="flex flex-col items-start gap-2">
      <ReactionPopover
        summary={reactionQuery.data}
        onToggle={userId ? handleReactionToggle : undefined}
        disabled={!userId || toggleMutation.isPending}
      />
      {toggleMutation.isError && toggleMutation.variables && (
        <div role="alert" className="flex flex-col items-start gap-1">
          <p className="text-sm text-destructive">{t.community.reactionSaveFailed}</p>
          <button
            type="button"
            onClick={retryToggle}
            disabled={toggleMutation.isPending}
            className="min-h-11 px-1 font-mono text-xs font-semibold uppercase tracking-wider text-foreground underline underline-offset-4 disabled:opacity-50"
          >
            {toggleMutation.isPending ? t.action.loading : t.action.retry}
          </button>
        </div>
      )}
    </div>
  )
}
