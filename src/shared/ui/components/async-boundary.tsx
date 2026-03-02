import { useT } from "@shared/i18n"
import { ErrorBoundary, Suspense } from "@suspensive/react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { RefreshCcwIcon } from "lucide-react"

import type { ErrorBoundaryFallbackProps } from "@suspensive/react"
import type { ReactNode } from "react"

interface AsyncBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

function QueryErrorFallback({ error, reset }: ErrorBoundaryFallbackProps) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-mono text-sm text-muted-foreground">
        {error.message || t.asyncBoundary.errorMessage}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <RefreshCcwIcon className="size-3" />
        {t.action.retry}
      </button>
    </div>
  )
}

/**
 * QueryErrorResetBoundary + ErrorBoundary + Suspense 를 하나로 묶은 래퍼.
 * useSuspenseQuery를 쓰는 컴포넌트를 감싸면 로딩·에러·재시도를 자동 처리합니다.
 */
export function AsyncBoundary({ children, fallback }: AsyncBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={QueryErrorFallback} onReset={reset}>
          <Suspense fallback={fallback ?? <DefaultSkeleton />}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-muted"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  )
}
