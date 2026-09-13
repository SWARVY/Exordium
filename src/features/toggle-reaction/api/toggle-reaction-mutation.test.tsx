import { reactionKeys } from "@entities/reaction"
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

import { useToggleCommentReaction, useTogglePostReaction } from "./toggle-reaction-mutation"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it.each([
  ["post", useTogglePostReaction, reactionKeys.byPost],
  ["comment", useToggleCommentReaction, reactionKeys.byComment],
] as const)(
  "keeps a failed %s reaction in its original viewer cache",
  async (_name, useToggle, key) => {
    let respond!: (response: Response) => void
    const request = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          respond = resolve
        }),
    )
    vi.stubGlobal("fetch", request)
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const original = { "👍": { count: 2, reacted: false } }
    const other = { "👍": { count: 7, reacted: true } }
    client.setQueryData(key("target", "owner-a"), original)
    client.setQueryData(key("target", "owner-b"), other)
    const { result, rerender } = renderHook(({ user }) => useToggle("target", user), {
      initialProps: { user: "owner-a" },
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    act(() => result.current.mutate({ emoji: "👍", reacted: false }))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    rerender({ user: "owner-b" })
    respond(new Response(JSON.stringify({ message: "denied" }), { status: 403 }))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(key("target", "owner-a"))).toEqual(original)
    expect(client.getQueryData(key("target", "owner-b"))).toEqual(other)
    client.clear()
  },
)
