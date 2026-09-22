import { useT } from "@shared/i18n"
import { Skeleton } from "@shared/ui/components/skeleton"

const OPEN_SOURCE_SKELETON_KEYS = ["project-1", "project-2", "project-3", "project-4"]

export function OpenSourceSkeleton() {
  const t = useT()
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label={t.aria.projectLoading}>
      {OPEN_SOURCE_SKELETON_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-4 rounded-sm border border-border bg-card p-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
