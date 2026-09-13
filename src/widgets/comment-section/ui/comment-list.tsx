import { commentQueryOptions } from "@entities/comment"
import { useT } from "@shared/i18n"
import { useQuery } from "@tanstack/react-query"
import { MessageSquareIcon } from "lucide-react"

import { CommentItem } from "./comment-item"
import { CommentSkeleton } from "./comment-skeleton"

interface CommentListProps {
  postId: string
}

export function CommentList({ postId }: CommentListProps) {
  const t = useT()
  const {
    data: comments,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(commentQueryOptions.byPost(postId))

  if (isPending) return <CommentSkeleton />

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-sm border border-destructive bg-card p-4"
      >
        <p className="text-sm leading-relaxed text-destructive">{t.community.commentsLoadFailed}</p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="min-h-11 rounded-sm border border-input bg-background px-4 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary-ink disabled:cursor-wait disabled:opacity-50"
        >
          {isFetching ? t.action.loading : t.action.retry}
        </button>
      </div>
    )
  }

  const rootComments = (comments ?? []).filter((c) => c.parentId === null)
  const repliesMap = new Map<string, NonNullable<typeof comments>>()
  ;(comments ?? [])
    .filter((c) => c.parentId !== null)
    .forEach((reply) => {
      const list = repliesMap.get(reply.parentId!) ?? []
      list.push(reply)
      repliesMap.set(reply.parentId!, list)
    })

  if (rootComments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-border py-10 text-center">
        <MessageSquareIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="font-mono text-xs font-medium text-foreground">{t.comment.noCommentsYet}</p>
        <p className="font-mono text-xs text-muted-foreground">{t.comment.empty}</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-6">
      {rootComments.map((comment) => (
        <li key={comment.id}>
          <CommentItem
            comment={comment}
            replies={repliesMap.get(comment.id) ?? []}
            postId={postId}
          />
        </li>
      ))}
    </ul>
  )
}
