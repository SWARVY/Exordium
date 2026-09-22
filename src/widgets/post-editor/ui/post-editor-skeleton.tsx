import { useT } from "@shared/i18n"
import { Skeleton } from "@shared/ui/components/skeleton"
import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react"

export function PostEditorSkeleton() {
  const t = useT()
  return (
    <section aria-busy="true" aria-label={t.postEditor.editPost}>
      <div className="grid-paper border-b border-border">
        <div className="page-shell py-6 sm:py-8">
          <h1 className="form-heading">{t.postEditor.editPost}</h1>
        </div>
      </div>
      <div className="page-shell py-6 sm:py-8">
        <p role="status" className="sr-only">
          {t.action.loading}
        </p>
        <div
          aria-hidden="true"
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-x-8"
        >
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-xs" />
              <Skeleton className="h-11 w-full rounded-xs" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-16 rounded-xs" />
              <div className="min-h-[360px] rounded-xs border border-border bg-card p-4 sm:min-h-[560px]">
                <Skeleton className="mb-6 h-8 w-full rounded-xs" />
                <Skeleton className="mb-3 h-4 w-4/5 rounded-xs" />
                <Skeleton className="h-4 w-3/5 rounded-xs" />
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-xs border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2">
                <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
                {t.editing.additionalSettings}
              </span>
              <ChevronDownIcon className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
