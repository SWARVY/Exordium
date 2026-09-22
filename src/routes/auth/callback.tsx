import { LoginButton } from "@features/auth"
import { supabase } from "@shared/api/supabase-client"
import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { buttonVariants } from "@shared/ui/components/button"
import { createFileRoute, Link } from "@tanstack/react-router"
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/auth/callback")({ component: AuthCallbackPage })

function AuthCallbackPage() {
  const t = useT()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const complete = async () => {
      if (new URLSearchParams(window.location.search).has("error"))
        throw new Error("OAuth cancelled")
      // The browser client performs the PKCE exchange during initialization.
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) throw new Error("No authenticated session")
      const verified = await supabase.auth.getUser()
      if (verified.error || !verified.data.user) throw new Error("Session verification failed")
      if (active) window.location.replace(routes.home)
    }
    void complete().catch(() => {
      if (active) setFailed(true)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <section
      className="w-full min-w-0 max-w-lg border border-border border-t-4 border-t-primary bg-background"
      aria-labelledby="auth-title"
    >
      <div className="flex items-center gap-2 border-b border-border px-[clamp(1rem,5vw,2.5rem)] py-4">
        <span className="size-2 shrink-0 bg-primary" aria-hidden="true" />
        <span className="font-mono text-xs font-semibold tracking-wide text-muted-foreground">
          GitHub · {t.action.login}
        </span>
      </div>
      <div className="px-[clamp(1rem,5vw,2.5rem)] py-8 sm:py-10">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xs bg-accent text-primary-ink">
          {failed ? (
            <TriangleAlertIcon className="size-5" aria-hidden="true" />
          ) : (
            <LoaderCircleIcon className="size-5 motion-safe:animate-spin" aria-hidden="true" />
          )}
        </div>
        <h1 id="auth-title" className="form-heading text-foreground">
          {failed ? t.authFlow.failedTitle : t.authFlow.checking}
        </h1>
        <p
          role={failed ? "alert" : "status"}
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
        >
          {failed ? t.authFlow.failed : t.authFlow.checkingDescription}
        </p>
        {failed && (
          <div className="mt-6 flex flex-wrap items-center gap-3 [&_button]:max-w-full [&_button]:whitespace-normal [&_button]:[overflow-wrap:anywhere]">
            <LoginButton label={t.authFlow.retry} />
            <Link
              to={routes.home}
              className={buttonVariants({
                variant: "ghost",
                className: "max-w-full whitespace-normal [overflow-wrap:anywhere]",
              })}
            >
              {t.action.backHome}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
