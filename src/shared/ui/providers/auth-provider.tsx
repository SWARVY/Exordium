import { supabase } from "@shared/api/supabase-client"
import { useQueryClient } from "@tanstack/react-query"
import { createContext, useEffect, useState } from "react"

import type { Session } from "@supabase/supabase-js"

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
})

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    let currentIdentity: string | null | undefined
    const updateSession = (next: Session | null) => {
      if (!active) return
      const identity = next?.user.id ?? null
      const changed = currentIdentity !== undefined && currentIdentity !== identity
      currentIdentity = identity
      setSession(next)
      setIsLoading(false)
      if (changed)
        queueMicrotask(() => {
          if (active) void queryClient.resetQueries()
        })
    }
    const refreshSession = () => {
      void supabase.auth
        .getSession()
        .then(({ data, error }) => {
          updateSession(error ? null : data.session)
        })
        .catch(() => updateSession(null))
    }
    refreshSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      updateSession(newSession)
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshSession()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      active = false
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [queryClient])

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>
}
