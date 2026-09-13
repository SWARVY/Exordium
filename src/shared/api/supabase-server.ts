import { env } from "@shared/config/env"
import { createServerClient } from "@supabase/ssr"
import { getCookies, getRequest, setCookie, setResponseHeader } from "@tanstack/react-start/server"

import type { SupabaseClient } from "@supabase/supabase-js"

const clients = new WeakMap<Request, SupabaseClient>()

export function getServerSupabase(): SupabaseClient {
  const request = getRequest()
  const existing = clients.get(request)
  if (existing) return existing
  const cookies = new Map(Object.entries(getCookies()))
  if ([...cookies.keys()].some((name) => name.startsWith("sb-"))) {
    setResponseHeader("Cache-Control", "private, no-store")
  }
  const client = createServerClient(env.supabase.url, env.supabase.publishableKey, {
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: (updates) => {
        for (const { name, value, options } of updates) {
          cookies.set(name, value)
          setCookie(name, value, options)
        }
        setResponseHeader("Cache-Control", "private, no-store")
      },
    },
  })
  clients.set(request, client)
  return client
}
