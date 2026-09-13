import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, act, waitFor } from "@testing-library/react"
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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
import { useDeletePost } from "./delete-post-mutation"

afterEach(() => vi.unstubAllGlobals())
it("does not report deletion success when RLS or a stale id matches no post", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200 })))
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const { result } = renderHook(() => useDeletePost(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  act(() => result.current.mutate("not-visible"))
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.isSuccess).toBe(false)
})
