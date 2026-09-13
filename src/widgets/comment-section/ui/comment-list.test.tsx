import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
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

import { CommentList } from "./comment-list"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("shows a comment load failure separately from the empty state and retries", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Database unavailable", code: "XX000" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(new Response("[]", { headers: { "Content-Type": "application/json" } }))
  vi.stubGlobal("fetch", request)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <CommentList postId="post-1" />
    </QueryClientProvider>,
  )

  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "댓글을 불러오지 못했습니다. 연결을 확인하고 다시 시도해주세요.",
    ),
  )
  expect(screen.queryByText("// no comments yet")).toBeNull()

  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))

  await waitFor(() => expect(screen.getByText("// no comments yet")).toBeTruthy())
  expect(screen.queryByRole("alert")).toBeNull()
  expect(request).toHaveBeenCalledTimes(2)
  client.clear()
})
