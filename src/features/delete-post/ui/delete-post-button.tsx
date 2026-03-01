import { useT } from "@shared/i18n"
import { ConfirmDialog } from "@shared/ui/components/confirm-dialog"

import { useDeletePost } from "../api/delete-post-mutation"

interface DeletePostButtonProps {
  postId: string
  onSuccess?: () => void
}

export function DeletePostButton({ postId, onSuccess }: DeletePostButtonProps) {
  const { mutate: deletePost, isPending } = useDeletePost()
  const t = useT()

  const handleConfirm = () => {
    deletePost(postId, { onSuccess })
  }

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          disabled={isPending}
          aria-label={t.aria.deletePost}
          className="rounded-sm border border-border px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
        >
          {isPending ? t.action.deleting : t.action.delete}
        </button>
      }
      title={t.aria.deletePost}
      description={t.post.deleteConfirm}
      confirmLabel={t.action.delete}
      variant="destructive"
      onConfirm={handleConfirm}
      isPending={isPending}
    />
  )
}
