import { useT } from "@shared/i18n"
import { routes } from "@shared/constants/routes"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"

export function NotFoundPage() {
  const t = useT()

  return (
    <div className="grid-paper flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          — {t.error.notFoundTitle}
        </span>
        <h1 className="mt-3 text-[8rem] font-black leading-none tracking-tighter text-foreground">
          {t.error.notFoundTitle}
        </h1>
        <p className="mt-2 text-lg font-semibold text-foreground">{t.error.notFoundDesc}</p>
        <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground">
          {t.error.notFoundSub}
        </p>
        <Link
          to={routes.home}
          className="mt-8 inline-flex items-center gap-2 rounded-sm border border-border px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeftIcon className="size-3" />
          {t.action.backHome}
        </Link>
      </div>
    </div>
  )
}
