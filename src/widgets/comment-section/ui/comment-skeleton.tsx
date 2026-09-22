import { useT } from "@shared/i18n"
import { Skeleton } from "@shared/ui/components/skeleton"

const COMMENT_SKELETON_KEYS = ["comment-1", "comment-2", "comment-3"]

export function CommentSkeleton() {
  const t = useT()
  return (
    <div className="flex flex-col gap-6" aria-label={t.aria.commentLoading}>
      {COMMENT_SKELETON_KEYS.map((key) => (
        <div key={key} className="flex gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
