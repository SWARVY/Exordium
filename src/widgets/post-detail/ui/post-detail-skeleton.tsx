import { useT } from "@shared/i18n"
import { Skeleton } from "@shared/ui/components/skeleton"

const POST_DETAIL_FIRST_PARAGRAPH_KEYS = [
  "first-1",
  "first-2",
  "first-3",
  "first-4",
  "first-5",
  "first-6",
]
const POST_DETAIL_SECOND_PARAGRAPH_KEYS = ["second-1", "second-2", "second-3", "second-4"]

export function PostDetailSkeleton() {
  const t = useT()
  return (
    <div aria-label={t.aria.postLoading}>
      {/* ── Hero header ── */}
      <div className="grid-paper border-b border-border">
        <div className="reading-shell reading-space">
          {/* Tags */}
          <div className="mb-4 flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          {/* Title */}
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="mt-2 h-12 w-3/5" />

          {/* Description */}
          <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-2xl" />

          {/* Meta row */}
          <div className="mt-6 flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="reading-shell reading-space">
        <div className="flex flex-col gap-3">
          {POST_DETAIL_FIRST_PARAGRAPH_KEYS.map((key) => (
            <Skeleton key={key} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-3/4" />
          <div className="my-2" />
          {POST_DETAIL_SECOND_PARAGRAPH_KEYS.map((key) => (
            <Skeleton key={key} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}
