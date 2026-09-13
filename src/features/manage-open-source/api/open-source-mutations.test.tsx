import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@shared/api/supabase-client", async () => {
  const { createClient } = await import("@supabase/supabase-js")
  return {
    supabase: createClient("https://example.supabase.co", "test-publishable-key", {
      auth: { persistSession: false },
      global: { fetch: (...args) => fetch(...args) },
    }),
  }
})

import { openSourceKeys } from "@entities/open-source"

import {
  useCreateOpenSource,
  useDeleteOpenSource,
  useReorderOpenSource,
  useUpdateOpenSource,
} from "./open-source-mutations"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const row = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Project",
  description: "Project description",
  repo_url: "https://github.com/example/project",
  language: "TypeScript",
  order: 0,
  created_at: "2026-09-11T00:00:00Z",
  updated_at: "2026-09-11T00:00:00Z",
}

const form = {
  name: row.name,
  description: row.description,
  repoUrl: row.repo_url,
  language: row.language,
}

function createWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe("project writes", () => {
  it("does not report deletion success and restores the list when no row was deleted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const original = [
      {
        id: row.id,
        name: row.name,
        description: row.description,
        repoUrl: row.repo_url,
        language: row.language,
        order: row.order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    ]
    client.setQueryData(openSourceKeys.lists(), original)
    const { result } = renderHook(() => useDeleteOpenSource(), {
      wrapper: createWrapper(client),
    })

    act(() => result.current.mutate(row.id))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isSuccess).toBe(false)
    expect(client.getQueryData(openSourceKeys.lists())).toEqual(original)
    client.clear()
  })

  it.each([
    ["create", useCreateOpenSource, form],
    ["update", useUpdateOpenSource, { id: row.id, form }],
    ["delete", useDeleteOpenSource, row.id],
  ] as const)("invalidates project search caches after %s", async (_name, useWrite, variables) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(row), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(openSourceKeys.search("project"), [row])
    const { result } = renderHook(() => useWrite(), { wrapper: createWrapper(client) })

    await act(() => result.current.mutateAsync(variables as never))

    expect(client.getQueryState(openSourceKeys.search("project"))?.isInvalidated).toBe(true)
    client.clear()
  })
})

describe("project ordering", () => {
  it("rejects when the atomic reorder RPC returns a database error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Order update failed", code: "XX000" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const original = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "First",
        description: "First project",
        repoUrl: "https://github.com/example/first",
        language: "TypeScript",
        order: 0,
        createdAt: "2026-09-11T00:00:00Z",
        updatedAt: "2026-09-11T00:00:00Z",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Second",
        description: "Second project",
        repoUrl: "https://github.com/example/second",
        language: "TypeScript",
        order: 1,
        createdAt: "2026-09-11T00:00:00Z",
        updatedAt: "2026-09-11T00:00:00Z",
      },
    ]
    client.setQueryData(openSourceKeys.lists(), original)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useReorderOpenSource(), { wrapper })

    await expect(
      result.current.mutateAsync([
        { id: "00000000-0000-0000-0000-000000000002", order: 0 },
        { id: "00000000-0000-0000-0000-000000000001", order: 1 },
      ]),
    ).rejects.toMatchObject({ message: "Order update failed" })
    expect(client.getQueryData(openSourceKeys.lists())).toEqual(original)

    client.clear()
  })

  it("sends the complete ordered id list in one RPC request", async () => {
    const request = vi.fn().mockResolvedValue(
      new Response("null", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", request)
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useReorderOpenSource(), { wrapper })

    await result.current.mutateAsync([
      { id: "00000000-0000-0000-0000-000000000002", order: 0 },
      { id: "00000000-0000-0000-0000-000000000001", order: 1 },
    ])

    expect(request).toHaveBeenCalledTimes(1)
    expect(String(request.mock.calls[0][1].body)).toContain(
      '"project_ids":["00000000-0000-0000-0000-000000000002","00000000-0000-0000-0000-000000000001"]',
    )
    client.clear()
  })
  it("preserves a project created while an earlier reorder fails", async () => {
    let respond!: (response: Response) => void
    const request = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          respond = resolve
        }),
    )
    vi.stubGlobal("fetch", request)
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const original = [{ ...row, order: 0 }]
    client.setQueryData(openSourceKeys.lists(), original)
    const { result } = renderHook(() => useReorderOpenSource(), { wrapper: createWrapper(client) })
    act(() => result.current.mutate([{ id: row.id, order: 0 }]))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    const created = { ...row, id: "created-during-reorder", name: "New project", order: 1 }
    client.setQueryData(openSourceKeys.lists(), [...original, created])
    respond(new Response(JSON.stringify({ message: "failed" }), { status: 403 }))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(openSourceKeys.lists())).toEqual([...original, created])
    expect(client.getQueryState(openSourceKeys.lists())?.isInvalidated).toBe(true)
    client.clear()
  })
})
