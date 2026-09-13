import { reactionQueryOptions } from "@entities/reaction"
import { useTogglePostReaction } from "@features/toggle-reaction"
import { useT } from "@shared/i18n"
import { ReactionBar } from "@shared/ui/components/reaction-bar"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { useContext, useRef } from "react"

import type { ReactionEmoji } from "@entities/reaction"

interface PostReactionsProps {
  postId: string
}

export function PostReactions({ postId }: PostReactionsProps) {
  const { session } = useContext(AuthContext)
  const userId = session?.user?.id
  const toggleLockRef = useRef(false)

  const reactionQuery = useQuery(reactionQueryOptions.byPost(postId, userId))
  const summary = reactionQuery.data
  const {
    mutate: toggle,
    variables: failedToggle,
    isPending,
    isError,
  } = useTogglePostReaction(postId, userId)
  const t = useT()

  function handleToggle(variables: { emoji: ReactionEmoji; reacted: boolean }) {
    if (toggleLockRef.current) return
    toggleLockRef.current = true
    toggle(variables, {
      onSettled: () => {
        toggleLockRef.current = false
      },
    })
  }

  if (reactionQuery.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-destructive">{t.community.reactionsLoadFailed}</p>
        <button
          type="button"
          onClick={() => reactionQuery.refetch()}
          disabled={reactionQuery.isFetching}
          className="min-h-11 rounded-sm border border-input bg-background px-4 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary-ink disabled:cursor-wait disabled:opacity-50"
        >
          {reactionQuery.isFetching ? t.action.loading : t.action.retry}
        </button>
      </div>
    )
  }

  if (!summary) return null

  return (
    <section aria-label={t.reaction.label} className="flex flex-col items-center gap-1 text-center">
      <h2 className="font-mono text-xs font-semibold text-muted-foreground">{t.reaction.label}</h2>
      <ReactionBar
        summary={summary}
        onToggle={
          userId ? (emoji) => handleToggle({ emoji, reacted: summary[emoji].reacted }) : undefined
        }
        disabled={!userId || isPending}
      />
      {isError && failedToggle && (
        <div role="alert" className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-destructive">{t.community.reactionSaveFailed}</p>
          <button
            type="button"
            onClick={() => handleToggle(failedToggle)}
            disabled={isPending}
            className="min-h-11 rounded-sm border border-input bg-background px-4 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary-ink disabled:cursor-wait disabled:opacity-50"
          >
            {isPending ? t.action.loading : t.action.retry}
          </button>
        </div>
      )}
      {!userId && <p className="type-meta text-muted-foreground">{t.reaction.loginRequired}</p>}
    </section>
  )
}
