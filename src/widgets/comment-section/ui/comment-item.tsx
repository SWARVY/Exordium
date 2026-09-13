import { UserAvatar } from "@entities/user"
import { CommentForm } from "@features/create-comment/ui/comment-form"
import { DeleteCommentButton } from "@features/delete-comment"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { formatShortDate } from "@shared/lib/utils"
import { Button } from "@shared/ui/components/button"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useState, useContext } from "react"

import { CommentReactions } from "./comment-reactions"
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
  const isOwner = useIsOwner()
  const [isReplying, setIsReplying] = useState(false)

  const t = useT()
  const canDelete = userId === comment.authorId || isOwner

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
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
            <time dateTime={comment.createdAt} className="font-mono text-xs text-muted-foreground">
              {timeLabel}
            </time>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
            {comment.content}
          </p>

          <div className="flex flex-wrap items-center gap-1">
            <CommentReactions commentId={comment.id} userId={userId} />
            {session && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={isReplying}
                onClick={() => setIsReplying((v) => !v)}
                className="min-w-11 text-muted-foreground"
              >
                {isReplying ? t.action.cancel : t.action.reply}
              </Button>
            )}
            {canDelete && (
              <DeleteCommentButton
                commentId={comment.id}
                postId={postId}
                kind="comment"
                replyCount={replies.length}
              />
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
