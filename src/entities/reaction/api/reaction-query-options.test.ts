import { QueryClient } from "@tanstack/react-query"
import { afterEach, expect, it, vi } from "vitest"

vi.mock("@shared/api/supabase-client", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  return {
    supabase: createClient("https://example.supabase.co", "test-publishable-key", {
      auth: { persistSession: false },
      global: { fetch: (...args) => fetch(...args) },
    }),
  }
})

import { reactionQueryOptions } from "./reaction-query-options"

afterEach(() => vi.unstubAllGlobals())

it("recomputes reacted state when the current user changes", async () => {
  const request = vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify([{ emoji: "👍", user_id: "user-a" }]), {
        headers: { "Content-Type": "application/json" },
      }),
    ),
  )
  vi.stubGlobal("fetch", request)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })

  const first = await client.ensureQueryData(reactionQueryOptions.byPost("post-1", "user-a"))
  const second = await client.ensureQueryData(reactionQueryOptions.byPost("post-1", "user-b"))

  expect(first["👍"].reacted).toBe(true)
  expect(second["👍"].reacted).toBe(false)
  expect(request).toHaveBeenCalledTimes(2)
  client.clear()
})
