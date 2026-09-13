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

import { SearchOverlay } from "./search-overlay"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("shows a failed search as an error and lets the reader retry", async () => {
  const request = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ message: "Unavailable" }), { status: 503 })),
    )
  vi.stubGlobal("fetch", request)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <SearchOverlay open onClose={() => {}} />
    </QueryClientProvider>,
  )

  fireEvent.change(screen.getByRole("searchbox", { name: "검색" }), {
    target: { value: "hello, world!" },
  })
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("검색 결과를 불러오지 못했어요"),
  )
  expect(screen.queryByText('"hello, world!"에 대한 결과가 없습니다.')).toBeNull()

  request.mockImplementation(() => Promise.resolve(new Response("[]")))
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe('"hello, world!"에 대한 결과가 없습니다.'),
  )
  expect(screen.queryByRole("alert")).toBeNull()
  client.clear()
})
