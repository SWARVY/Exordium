import { reactionKeys } from "@entities/reaction"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

import type { Comment } from "@entities/comment"
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

import { CommentItem } from "./comment-item"

const EMPTY_SUMMARY: ReactionSummary = {
  "👍": { count: 0, reacted: false },
  "❤️": { count: 0, reacted: false },
  "🔥": { count: 0, reacted: false },
  "💡": { count: 0, reacted: false },
  "😮": { count: 0, reacted: false },
}

const rootComment: Comment = {
  id: "comment-1",
  postId: "post-1",
  parentId: null,
  authorId: "user-a",
  authorName: "Writer",
  authorAvatarUrl: null,
  content: "Root comment",
  createdAt: "2026-09-11T00:00:00.000Z",
  updatedAt: "2026-09-11T00:00:00.000Z",
}

const reply: Comment = {
  ...rootComment,
  id: "reply-1",
  parentId: rootComment.id,
  authorId: "user-b",
  authorName: "Replier",
  content: "Reply",
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("lets the owner moderate another user's comment with cascade warning and retryable failure", async () => {
  const request = vi
    .fn()
    .mockResolvedValue(new Response("[]", { headers: { "Content-Type": "application/json" } }))
  vi.stubGlobal("fetch", request)
  const ownerId = "owner-1"
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(reactionKeys.byComment(rootComment.id, ownerId), EMPTY_SUMMARY)
  client.setQueryData(reactionKeys.byComment(reply.id, ownerId), EMPTY_SUMMARY)
  const session = { user: { id: ownerId, app_metadata: { role: "owner" } } } as unknown as Session

  render(
    <AuthContext.Provider value={{ session, isLoading: false }}>
      <QueryClientProvider client={client}>
        <CommentItem comment={rootComment} replies={[reply]} postId="post-1" />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )

  fireEvent.click(screen.getByRole("button", { name: "댓글 삭제" }))
  const dialog = screen.getByRole("dialog")
  expect(dialog.textContent).toContain("답글 1개도 함께 삭제됩니다")
  fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }))

  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "댓글을 삭제하지 못했습니다. 다시 시도해주세요.",
    ),
  )
  expect(screen.getByText("Root comment")).toBeTruthy()
  expect(request).toHaveBeenCalledTimes(1)
  client.clear()
})

it("restores a failed comment reaction and exposes a retry", async () => {
  let writes = 0
  const request = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const method = input instanceof Request ? input.method : init?.method
    if (method === "POST") {
      writes += 1
      if (writes === 1) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }),
        )
      }
      return Promise.resolve(new Response("", { status: 201 }))
    }
    return Promise.resolve(new Response("[]", { headers: { "Content-Type": "application/json" } }))
  })
  vi.stubGlobal("fetch", request)
  const userId = rootComment.authorId
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(reactionKeys.byComment(rootComment.id, userId), EMPTY_SUMMARY)
  const session = { user: { id: userId, app_metadata: { role: "user" } } } as unknown as Session

  render(
    <AuthContext.Provider value={{ session, isLoading: false }}>
      <QueryClientProvider client={client}>
        <CommentItem comment={rootComment} replies={[]} postId="post-1" />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )

  fireEvent.click(screen.getByRole("button", { name: "반응 추가" }))
  fireEvent.click(screen.getByRole("button", { name: "👍" }))

  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "반응을 저장하지 못했습니다. 다시 시도해주세요.",
    ),
  )
  expect(client.getQueryData(reactionKeys.byComment(rootComment.id, userId))).toEqual(EMPTY_SUMMARY)

  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))
  await waitFor(() => expect(writes).toBe(2))
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
  client.clear()
})
