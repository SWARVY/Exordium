import { useT } from "@shared/i18n"
import { ErrorBoundary, Suspense } from "@suspensive/react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { RefreshCcwIcon } from "lucide-react"

import { Button } from "./button"

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
      <p className="font-mono text-sm text-muted-foreground">{t.asyncBoundary.errorMessage}</p>
      {import.meta.env.DEV && error.message && (
        <details className="max-w-full text-left text-xs text-muted-foreground">
          <summary className="cursor-pointer font-mono">Debug</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{error.message}</pre>
        </details>
      )}
      <Button variant="outline" type="button" onClick={reset}>
        <RefreshCcwIcon className="size-3" />
        {t.action.retry}
      </Button>
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

const skeletonLines = [{ width: "70%" }, { width: "80%" }, { width: "90%" }]

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-8">
      {skeletonLines.map((style) => (
        <div key={style.width} className="h-4 animate-pulse rounded bg-muted" style={style} />
      ))}
    </div>
  )
}
