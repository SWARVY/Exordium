import { reactionKeys } from "@entities/reaction"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

import type { ReactionSummary } from "@entities/reaction"
import type { Session } from "@supabase/supabase-js"

vi.mock("@shared/api/supabase-client", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  return {
    supabase: createClient("https://example.supabase.co", "test-publishable-key", {
      auth: { persistSession: false },
      global: { fetch: (...args) => fetch(...args) },
    }),
  }
})

import { PostReactions } from "./post-reactions"

const EMPTY_SUMMARY: ReactionSummary = {
  "👍": { count: 0, reacted: false },
  "❤️": { count: 0, reacted: false },
  "🔥": { count: 0, reacted: false },
  "💡": { count: 0, reacted: false },
  "😮": { count: 0, reacted: false },
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("shows a reaction load failure and retries it", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(new Response("[]", { headers: { "Content-Type": "application/json" } }))
  vi.stubGlobal("fetch", request)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <PostReactions postId="post-1" />
    </QueryClientProvider>,
  )

  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "반응을 불러오지 못했습니다. 다시 시도해주세요.",
    ),
  )
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))
  await waitFor(() => expect(screen.getByRole("button", { name: "👍" })).toBeTruthy())
  expect(screen.queryByRole("alert")).toBeNull()
  client.clear()
})

it("blocks duplicate reaction toggles and lets the user retry a failed toggle", async () => {
  let rejectFirst!: () => void
  const firstFailure = new Promise<Response>((resolve) => {
    rejectFirst = () =>
      resolve(
        new Response(JSON.stringify({ message: "Unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
  })
  let writes = 0
  const request = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const method = input instanceof Request ? input.method : init?.method
    if (method === "POST") {
      writes += 1
      return writes === 1 ? firstFailure : Promise.resolve(new Response("", { status: 201 }))
    }
    return Promise.resolve(new Response("[]", { headers: { "Content-Type": "application/json" } }))
  })
  vi.stubGlobal("fetch", request)

  const userId = "user-a"
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(reactionKeys.byPost("post-1", userId), EMPTY_SUMMARY)
  const session = { user: { id: userId } } as Session

  render(
    <AuthContext.Provider value={{ session, isLoading: false }}>
      <QueryClientProvider client={client}>
        <PostReactions postId="post-1" />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )

  const likeButton = screen.getByRole("button", { name: "👍" })
  fireEvent.click(likeButton)
  fireEvent.click(likeButton)
  await waitFor(() => expect(writes).toBe(1))

  rejectFirst()
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "반응을 저장하지 못했습니다. 다시 시도해주세요.",
    ),
  )
  expect(client.getQueryData<ReactionSummary>(reactionKeys.byPost("post-1", userId))).toEqual(
    EMPTY_SUMMARY,
  )

  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))
  await waitFor(() => expect(writes).toBe(2))
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
  client.clear()
})
