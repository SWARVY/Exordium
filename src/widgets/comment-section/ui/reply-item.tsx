import { reactionQueryOptions } from "@entities/reaction"
import { formatShortDate } from "@shared/lib/utils"
import { UserAvatar } from "@entities/user"
import { useDeleteComment } from "@features/delete-comment"
import { useToggleCommentReaction } from "@features/toggle-reaction"
import { useT } from "@shared/i18n"
import { ReactionBar } from "@shared/ui/components/reaction-bar"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { useContext } from "react"

import type { Comment } from "@entities/comment"

interface ReplyItemProps {
  reply: Comment
  postId: string
}

export function ReplyItem({ reply, postId }: ReplyItemProps) {
  const { session } = useContext(AuthContext)
  const userId = session?.user?.id
  const { mutate: deleteComment, isPending } = useDeleteComment(postId)
  const canDelete = userId === reply.authorId

  const { data: reactionSummary } = useQuery(
    reactionQueryOptions.byComment(reply.id, userId),
  )
  const { mutate: toggleReaction } = useToggleCommentReaction(reply.id, userId)
  const t = useT()

  const timeLabel = formatShortDate(reply.createdAt)

  return (
    <article className="flex gap-3 bg-muted/30 p-4">
      <UserAvatar
        avatarUrl={reply.authorAvatarUrl}
        githubLogin={reply.authorName}
        name={reply.authorName}
        size="sm"
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{reply.authorName}</span>
          <time dateTime={reply.createdAt} className="font-mono text-[10px] text-muted-foreground">
            {timeLabel}
          </time>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{reply.content}</p>

        {reactionSummary && (
          <ReactionBar
            summary={reactionSummary}
            onToggle={
              userId
                ? (emoji) => toggleReaction({ emoji, reacted: reactionSummary[emoji].reacted })
                : undefined
            }
            disabled={!userId}
            size="sm"
          />
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => deleteComment(reply.id)}
            disabled={isPending}
            className="self-start font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            {t.action.delete}
          </button>
        )}
      </div>
    </article>
  )
}
