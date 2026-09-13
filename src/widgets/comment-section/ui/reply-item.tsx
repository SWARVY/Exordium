import { UserAvatar } from "@entities/user"
import { DeleteCommentButton } from "@features/delete-comment"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { formatShortDate } from "@shared/lib/utils"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useContext } from "react"

import { CommentReactions } from "./comment-reactions"

import type { Comment } from "@entities/comment"

interface ReplyItemProps {
  reply: Comment
  postId: string
}

export function ReplyItem({ reply, postId }: ReplyItemProps) {
  const { session } = useContext(AuthContext)
  const userId = session?.user?.id
  const isOwner = useIsOwner()
  const canDelete = userId === reply.authorId || isOwner

  const timeLabel = formatShortDate(reply.createdAt)

  return (
    <article className="flex gap-3 py-1">
      <UserAvatar
        avatarUrl={reply.authorAvatarUrl}
        githubLogin={reply.authorName}
        name={reply.authorName}
        size="sm"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-foreground">{reply.authorName}</span>
          <time dateTime={reply.createdAt} className="font-mono text-xs text-muted-foreground">
            {timeLabel}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {reply.content}
        </p>

        <div className="flex flex-wrap items-center gap-1">
          <CommentReactions commentId={reply.id} userId={userId} />
          {canDelete && <DeleteCommentButton commentId={reply.id} postId={postId} kind="reply" />}
        </div>
      </div>
    </article>
  )
}
