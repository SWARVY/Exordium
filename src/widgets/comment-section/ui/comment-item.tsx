import { reactionQueryOptions } from "@entities/reaction"
import { UserAvatar } from "@entities/user"
import { CommentForm } from "@features/create-comment/ui/comment-form"
import { useDeleteComment } from "@features/delete-comment"
import { useToggleCommentReaction } from "@features/toggle-reaction"
import { useT } from "@shared/i18n"
import { formatShortDate } from "@shared/lib/utils"
import { ReactionPopover } from "@shared/ui/components/reaction-popover"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { useState, useContext } from "react"

import { ReplyItem } from "./reply-item"

import type { Comment } from "@entities/comment"

interface CommentItemProps {
  comment: Comment
  replies: Comment[]
  postId: string
}

export function CommentItem({ comment, replies, postId }: CommentItemProps) {
  const { session } = useContext(AuthContext)
  const userId = session?.user?.id
  const { mutate: deleteComment, isPending } = useDeleteComment(postId)
  const [isReplying, setIsReplying] = useState(false)

  const { data: reactionSummary } = useQuery(reactionQueryOptions.byComment(comment.id, userId))
  const { mutate: toggleReaction } = useToggleCommentReaction(comment.id, userId)

  const t = useT()
  const canDelete = userId === comment.authorId

  const timeLabel = formatShortDate(comment.createdAt)

  return (
    <article className="flex flex-col rounded-sm border border-border bg-card">
      <div className="flex gap-3 p-4">
        <UserAvatar
          avatarUrl={comment.authorAvatarUrl}
          githubLogin={comment.authorName}
          name={comment.authorName}
          size="sm"
        />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
            <time
              dateTime={comment.createdAt}
              className="font-mono text-[10px] text-muted-foreground"
            >
              {timeLabel}
            </time>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{comment.content}</p>

          {reactionSummary && (
            <ReactionPopover
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

          <div className="flex items-center gap-3">
            {session && (
              <button
                type="button"
                onClick={() => setIsReplying((v) => !v)}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                {isReplying ? t.action.cancel : t.action.reply}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => deleteComment(comment.id)}
                disabled={isPending}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                {t.action.delete}
              </button>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <ul className="flex flex-col gap-2 border-l-2 border-primary/20 pl-4">
            {replies.map((reply) => (
              <li key={reply.id}>
                <ReplyItem reply={reply} postId={postId} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {isReplying && (
        <div className="border-t border-border p-4">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={() => setIsReplying(false)}
            placeholder={t.comment.replyPlaceholder}
            compact
          />
        </div>
      )}
    </article>
  )
}
