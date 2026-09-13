import { LoginButton } from "@features/auth"
import { supabase } from "@shared/api/supabase-client"
import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
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
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-bold">{failed ? t.authFlow.failed : t.authFlow.checking}</h1>
      {failed ? (
        <div className="flex flex-col gap-5">
          <p role="alert" className="text-destructive">
            {t.authFlow.failed}
          </p>
          <div className="flex items-center gap-4">
            <LoginButton />
            <Link to={routes.home} className="underline underline-offset-4">
              {t.nav.home}
            </Link>
          </div>
        </div>
      ) : (
        <p role="status">{t.action.loading}</p>
      )}
    </section>
  )
}
