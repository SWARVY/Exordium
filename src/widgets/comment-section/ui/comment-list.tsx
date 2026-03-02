import { commentQueryOptions } from "@entities/comment"
import { useT } from "@shared/i18n"
import { useQuery } from "@tanstack/react-query"

import { CommentItem } from "./comment-item"
import { CommentSkeleton } from "./comment-skeleton"

interface CommentListProps {
  postId: string
}

export function CommentList({ postId }: CommentListProps) {
  const t = useT()
  const { data: comments, isPending } = useQuery(commentQueryOptions.byPost(postId))

  if (isPending) return <CommentSkeleton />

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
        <span className="text-2xl">💬</span>
        <p className="font-mono text-xs font-medium text-foreground">{t.comment.noCommentsYet}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{t.comment.empty}</p>
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
