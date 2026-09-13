import { env } from "@shared/config/env"
import { createBrowserClient } from "@supabase/ssr"
import { createIsomorphicFn } from "@tanstack/react-start"

import { getServerSupabase } from "./supabase-server"

import type { SupabaseClient } from "@supabase/supabase-js"

const getClient: () => SupabaseClient = createIsomorphicFn()
  .server(getServerSupabase)
  .client(() => createBrowserClient(env.supabase.url, env.supabase.publishableKey))

// Resolve at call time so server requests never share an authenticated client.
export const supabase = {
  from: (table: string) => getClient().from(table),
  rpc: (name: string, args: Record<string, unknown> = {}) => getClient().rpc(name, args),
  get auth() {
    return getClient().auth
  },
  get storage() {
    return getClient().storage
  },
}
