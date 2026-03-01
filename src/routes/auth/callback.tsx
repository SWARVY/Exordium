import { supabase } from "@shared/api/supabase-client"
import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()
  const t = useT()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.search).then(() => {
      navigate({ to: routes.home, replace: true })
    })
  }, [navigate])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8">
      {/* Animated logo mark */}
      <div className="relative flex items-center justify-center">
        <div className="absolute size-20 animate-ping rounded-full bg-primary/10" />
        <div className="relative flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/5">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
            Ex
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          — Authenticating
        </p>
        <p className="font-mono text-sm text-muted-foreground">
          {t.action.login}
          <span className="inline-flex gap-0.5 ml-0.5">
            <span className="animate-bounce [animation-delay:0ms]">.</span>
            <span className="animate-bounce [animation-delay:150ms]">.</span>
            <span className="animate-bounce [animation-delay:300ms]">.</span>
          </span>
        </p>
      </div>
    </div>
  )
}
