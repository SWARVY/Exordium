import { useT } from "@shared/i18n"
import { Skeleton } from "@shared/ui/components/skeleton"

export function PostDetailSkeleton() {
  const t = useT()
  return (
    <div aria-label={t.aria.postLoading}>
      {/* ── Hero header ── */}
      <div className="grid-paper border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-12">
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
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-3/4" />
          <div className="my-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`p2-${i}`} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}
