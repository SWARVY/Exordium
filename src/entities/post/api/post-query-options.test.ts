import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@shared/api/supabase-client", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  return {
    supabase: createClient("https://example.supabase.co", "test-publishable-key", {
      auth: { persistSession: false },
      global: { fetch: (...args) => fetch(...args) },
    }),
  }
})

import { postQueryOptions } from "./post-query-options"

afterEach(() => vi.unstubAllGlobals())

describe("post lookup", () => {
  it("returns null when the requested slug has no visible post", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await expect(client.fetchQuery(postQueryOptions.detail("missing"))).resolves.toBeNull()
  })

  it("keeps database failures distinct from a missing post", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Database unavailable", code: "XX000" }), {
          status: 500,
        }),
      ),
    )
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await expect(client.fetchQuery(postQueryOptions.detail("hello"))).rejects.toMatchObject({
      message: "Database unavailable",
    })
  })
})
