import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

vi.mock("@shared/api/supabase-client", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  return {
    supabase: createClient("https://example.supabase.co", "test-publishable-key", {
      auth: { persistSession: false },
      global: {
        fetch: (...args) => fetch(...args),
        headers: { Authorization: "Bearer test-token" },
      },
    }),
  }
})

import { CommentForm } from "./comment-form"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("preserves comment input, announces the real save error, and focuses the field", async () => {
  const request = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const requestUrl = input instanceof Request ? input.url : String(input)
    if (requestUrl.includes("/auth/v1/user")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: "user-a",
            aud: "authenticated",
            role: "authenticated",
            email: "writer@example.com",
            app_metadata: {},
            user_metadata: { user_name: "Writer" },
            created_at: "2026-09-11T00:00:00.000Z",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
    }
    return Promise.resolve(
      new Response(JSON.stringify({ message: "Comment service unavailable", code: "XX000" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    )
  })
  vi.stubGlobal("fetch", request)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <CommentForm postId="post-1" />
    </QueryClientProvider>,
  )

  const textarea = screen.getByRole("textbox", { name: "댓글" })
  fireEvent.change(textarea, { target: { value: "Keep this comment" } })
  fireEvent.click(screen.getByRole("button", { name: "등록" }))

  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("Comment service unavailable"),
  )
  expect(textarea.getAttribute("aria-describedby")).toBe("comment-post-1-error")
  expect(textarea.getAttribute("aria-invalid")).toBe("true")
  expect(document.activeElement).toBe(textarea)
  expect((textarea as HTMLTextAreaElement).value).toBe("Keep this comment")
  client.clear()
})
