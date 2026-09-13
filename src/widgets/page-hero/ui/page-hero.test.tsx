import { siteConfigKeys } from "@entities/site-config"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

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

import { PageHero } from "./page-hero"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it("updates an existing subtitle without insert permission and keeps a failed draft retryable", async () => {
  let writes = 0
  const methods: string[] = []
  const urls: string[] = []
  const request = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input)
    const method = input instanceof Request ? input.method : (init?.method ?? "GET")
    methods.push(method)
    urls.push(url)

    if (method === "PATCH") {
      writes += 1
      if (writes === 1) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Site config update denied", code: "42501" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }),
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ key: "posts_subtitle", value: "A sharper subtitle" }), {
          headers: { "Content-Type": "application/json" },
        }),
      )
    }

    return Promise.resolve(
      new Response(
        JSON.stringify([
          { key: "posts_subtitle", value: "A sharper subtitle" },
          { key: "open_source_subtitle", value: "Projects" },
        ]),
        { headers: { "Content-Type": "application/json" } },
      ),
    )
  })
  vi.stubGlobal("fetch", request)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(siteConfigKeys.config(), {
    postsSubtitle: "Original subtitle",
    projectsSubtitle: "Projects",
  })
  const session = {
    user: { id: "owner-1", app_metadata: { role: "owner" } },
  } as unknown as Session

  render(
    <AuthContext.Provider value={{ session, isLoading: false }}>
      <QueryClientProvider client={client}>
        <PageHero tag="Posts" title="Posts" subtitleKey="postsSubtitle" />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )

  fireEvent.click(screen.getByRole("button", { name: "부제목 수정" }))
  const editor = screen.getByRole("textbox", { name: "부제목" })
  fireEvent.change(editor, { target: { value: "A sharper subtitle" } })
  fireEvent.click(screen.getByRole("button", { name: "저장" }))

  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("Site config update denied"),
  )
  expect((editor as HTMLTextAreaElement).value).toBe("A sharper subtitle")
  expect(document.activeElement).toBe(editor)
  expect(methods.filter((method) => method !== "GET")).toEqual(["PATCH"])
  expect(urls.some((url) => url.includes("key=eq.posts_subtitle"))).toBe(true)

  fireEvent.click(screen.getByRole("button", { name: "저장" }))
  await waitFor(() => expect(writes).toBe(2))
  await waitFor(() => expect(screen.getByText("A sharper subtitle")).toBeTruthy())
  expect(screen.queryByRole("textbox", { name: "부제목" })).toBeNull()
  client.clear()
})
