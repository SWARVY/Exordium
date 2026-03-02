import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { Link, useRouter } from "@tanstack/react-router"
import { ArrowLeftIcon, RefreshCcwIcon } from "lucide-react"

interface ErrorPageProps {
  error?: Error
  reset?: () => void
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const t = useT()

  return (
    <div className="grid-paper flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-destructive">
          — {t.error.errorTitle}
        </span>
        <h1 className="mt-3 text-[8rem] font-black leading-none tracking-tighter text-foreground">
          {t.error.errorTitle}
        </h1>
        <p className="mt-2 text-lg font-semibold text-foreground">{t.error.errorDesc}</p>
        <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground">
          {t.error.errorSub}
        </p>

        {error?.message && (
          <pre className="mt-4 rounded-sm border border-border bg-muted/50 px-4 py-3 text-left font-mono text-[11px] leading-relaxed text-muted-foreground">
            {error.message}
          </pre>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          {reset && (
            <button
              type="button"
              onClick={() => {
                reset()
                router.invalidate()
              }}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RefreshCcwIcon className="size-3" />
              {t.action.retry}
            </button>
          )}
          <Link
            to={routes.home}
            className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeftIcon className="size-3" />
            {t.action.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
