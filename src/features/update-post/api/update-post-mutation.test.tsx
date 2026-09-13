import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

vi.mock("@shared/api/supabase-client", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  return {
    supabase: createClient("https://example.supabase.co", "test-key", {
      auth: { persistSession: false },
      global: { fetch: (...args) => fetch(...args) },
    }),
  }
})
vi.mock("@shared/i18n", () => ({
  useT: () => ({ toast: { postUpdated: "updated", error: "error" } }),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { PostUpdateConflictError, useUpdatePost } from "./update-post-mutation"

afterEach(() => vi.unstubAllGlobals())

it("reports a conflict when the updated_at baseline no longer matches", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        code: "PGRST116",
        details: "The result contains 0 rows",
        hint: null,
        message: "JSON object requested, multiple (or no) rows returned",
      }),
      { status: 406 },
    ),
  )
  vi.stubGlobal("fetch", fetchMock)
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const { result } = renderHook(() => useUpdatePost(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })

  act(() =>
    result.current.mutate({
      id: "post-1",
      updatedAt: "2026-09-11T00:00:00.000Z",
      previousSlug: "old-slug",
      draft: {
        title: "Changed",
        description: "Changed summary",
        slug: "changed",
        content: '{"root":{"type":"root","children":[]}}',
        coverImage: "",
        tags: [],
      },
    }),
  )

  await waitFor(() => expect(result.current.error).toBeInstanceOf(PostUpdateConflictError))
  const request = fetchMock.mock.calls[0]?.[0] as Request | string
  const requestUrl = typeof request === "string" ? request : request.url
  expect(requestUrl).toContain("updated_at=eq.2026-09-11T00%3A00%3A00.000Z")
})
