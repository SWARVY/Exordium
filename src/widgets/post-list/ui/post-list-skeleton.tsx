import { useT } from "@shared/i18n"
import { Skeleton } from "@shared/ui/components/skeleton"

export function PostListSkeleton() {
  const t = useT()
  return (
    <ul className="post-grid" aria-label={t.aria.postListLoading}>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="post-card rounded-xs border border-border bg-card">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-[3.375rem] w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex h-11 shrink-0 items-center gap-2">
            <Skeleton className="h-5 w-14 rounded-xs" />
            <Skeleton className="h-5 w-14 rounded-xs" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </li>
      ))}
    </ul>
  )
}
