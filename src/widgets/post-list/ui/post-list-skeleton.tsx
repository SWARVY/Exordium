import { useT } from "@shared/i18n"
import { Skeleton } from "@shared/ui/components/skeleton"

export function PostListSkeleton() {
  const t = useT()
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label={t.aria.postListLoading}>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-4 rounded-sm border border-border bg-card p-6">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-4 w-20" />
        </li>
      ))}
    </ul>
  )
}
