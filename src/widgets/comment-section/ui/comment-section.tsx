import { CommentForm } from "@features/create-comment/ui/comment-form"
import { useT } from "@shared/i18n"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { useContext } from "react"

import { CommentList } from "./comment-list"
import { CommentSkeleton } from "./comment-skeleton"

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { session } = useContext(AuthContext)
  const t = useT()

  return (
    <section aria-label={t.comment.label} className="mt-12 flex flex-col gap-8 border-t border-border pt-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          {t.comment.header}
        </span>
      </div>

      {/* 댓글 작성 폼 */}
      {session ? (
        <CommentForm postId={postId} />
      ) : (
        <div className="flex items-center gap-3 rounded-sm border border-dashed border-border px-4 py-3">
          <span className="text-base">🔒</span>
          <p className="font-mono text-xs text-muted-foreground">
            {t.comment.loginRequired}
          </p>
        </div>
      )}

      {/* 댓글 목록 */}
      <AsyncBoundary fallback={<CommentSkeleton />}>
        <CommentList postId={postId} />
      </AsyncBoundary>
    </section>
  )
}
