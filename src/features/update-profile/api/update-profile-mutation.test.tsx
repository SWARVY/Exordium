import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { useUpdateProfile } from "./update-profile-mutation"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("does not report profile save success when RLS makes the update return no row", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "owner-id" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
  )
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const { result } = renderHook(() => useUpdateProfile(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })

  act(() =>
    result.current.mutate({
      name: "Ada Lovelace",
      bio: "Builder",
      avatarUrl: "https://example.com/avatar.png",
      githubUrl: "",
      twitterUrl: "",
      websiteUrl: "",
      skills: ["TypeScript"],
    }),
  )

  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.isSuccess).toBe(false)
  client.clear()
})
