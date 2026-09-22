import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { Link, useRouter } from "@tanstack/react-router"
import { ArrowLeftIcon, RefreshCcwIcon } from "lucide-react"
import { useCallback } from "react"

import { Button, buttonVariants } from "../button"

interface ErrorPageProps {
  error?: Error
  reset?: () => void
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const t = useT()
  const retry = useCallback(() => {
    reset?.()
    void router.invalidate()
  }, [reset, router])

  return (
    <div className="grid-paper flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-destructive">
          — {t.error.errorTitle}
        </span>
        <h1 className="mt-3 text-[clamp(3rem,16vw,8rem)] font-black leading-none tracking-tighter text-foreground">
          {t.error.errorTitle}
        </h1>
        <p className="mt-2 text-lg font-semibold text-foreground">{t.error.errorDesc}</p>
        <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground">
          {t.error.errorSub}
        </p>

        {import.meta.env.DEV && error?.message && (
          <details className="mt-4 text-left text-xs text-muted-foreground">
            <summary className="cursor-pointer font-mono">Debug</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{error.message}</pre>
          </details>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {reset && (
            <Button type="button" onClick={retry}>
              <RefreshCcwIcon className="size-3" />
              {t.action.retry}
            </Button>
          )}
          <Link to={routes.home} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeftIcon className="size-3" />
            {t.action.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
