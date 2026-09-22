import { useT } from "@shared/i18n"
import { Button } from "@shared/ui/components/button"
import { ConfirmDialog } from "@shared/ui/components/confirm-dialog"
import { FieldError } from "@shared/ui/components/field-error"
import { useCallback, useMemo } from "react"

import { useDeleteComment } from "../api/delete-comment-mutation"

interface DeleteCommentButtonProps {
  commentId: string
  postId: string
  kind: "comment" | "reply"
  replyCount?: number
}

export function DeleteCommentButton({
  commentId,
  postId,
  kind,
  replyCount = 0,
}: DeleteCommentButtonProps) {
  const t = useT()
  const { mutate: deleteComment, isPending, isError } = useDeleteComment(postId)
  const isReply = kind === "reply"
  const handleConfirm = useCallback(() => deleteComment(commentId), [commentId, deleteComment])
  const deleteErrors = useMemo(
    () => (isError ? [t.community.commentDeleteFailed] : []),
    [isError, t.community.commentDeleteFailed],
  )

  return (
    <div className="flex flex-col items-start gap-1">
      <ConfirmDialog
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            aria-label={isReply ? t.community.deleteReply : t.community.deleteComment}
            className="min-w-11 text-muted-foreground hover:text-destructive"
          >
            {isPending ? t.action.deleting : t.action.delete}
          </Button>
        }
        title={isReply ? t.community.replyDeleteTitle : t.community.commentDeleteTitle}
        description={
          isReply ? t.community.replyDeleteConfirm : t.community.commentDeleteConfirm(replyCount)
        }
        confirmLabel={t.action.delete}
        variant="destructive"
        onConfirm={handleConfirm}
        isPending={isPending}
      />
      <FieldError errors={deleteErrors} />
    </div>
  )
}
