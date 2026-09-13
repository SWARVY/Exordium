import { CommentForm } from "@features/create-comment/ui/comment-form"
import { useT } from "@shared/i18n"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { LockKeyholeIcon } from "lucide-react"
import { useContext } from "react"

import { CommentList } from "./comment-list"

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { session } = useContext(AuthContext)
  const t = useT()

  return (
    <section
      aria-label={t.comment.label}
      className="mt-8 flex flex-col gap-4 border-t border-border pt-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="type-section text-foreground">{t.comment.label}</h2>
      </div>

      {/* 댓글 작성 폼 */}
      {session ? (
        <CommentForm postId={postId} />
      ) : (
        <div className="flex items-center gap-3 rounded-sm border border-dashed border-border px-4 py-3">
          <LockKeyholeIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <p className="type-summary text-muted-foreground">{t.comment.loginRequired}</p>
        </div>
      )}

      {/* 댓글 목록 */}
      <CommentList postId={postId} />
    </section>
  )
}
