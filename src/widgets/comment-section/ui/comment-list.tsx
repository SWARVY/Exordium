import { commentQueryOptions } from "@entities/comment"
import { useT } from "@shared/i18n"
import { SuspenseQuery } from "@suspensive/react-query-5"

import { CommentItem } from "./comment-item"

interface CommentListProps {
  postId: string
}

export function CommentList({ postId }: CommentListProps) {
  const t = useT()

  return (
    <SuspenseQuery {...commentQueryOptions.byPost(postId)}>
      {({ data: comments }) => {
        const rootComments = comments.filter((c) => c.parentId === null)
        const repliesMap = new Map<string, typeof comments>()
        comments
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
              <p className="font-mono text-[10px] text-muted-foreground">
                {t.comment.empty}
              </p>
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
      }}
    </SuspenseQuery>
  )
}
