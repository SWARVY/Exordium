import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  userId: "owner-1" as string | null,
  pending: false,
  mutate: vi.fn(),
}))
vi.mock("@features/create-post", () => ({
  useCreatePost: () => ({ mutate: state.mutate, isPending: state.pending, isError: false }),
}))
vi.mock("@features/update-post", () => ({
  PostUpdateConflictError: class extends Error {},
  useUpdatePost: () => ({
    mutate: state.mutate,
    isPending: state.pending,
    isError: false,
    error: null,
  }),
}))
vi.mock("@shared/hooks/use-auth", () => ({
  useAuth: () => ({ user: state.userId ? { id: state.userId } : null, isLoading: false }),
}))
vi.mock("@tanstack/react-router", async (original) => ({
  ...(await original<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
  useBlocker: () => ({ status: "idle" }),
}))

import { PostEditorForm } from "./post-editor-form"

beforeEach(() => {
  state.userId = "owner-1"
  state.pending = false
  state.mutate.mockClear()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
})

it("locks metadata and the real editor while a save request is pending", async () => {
  const { rerender, container } = render(<PostEditorForm />)
  await screen.findByRole("textbox", { name: "본문" })
  fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Submitted title" } })
  state.pending = true
  rerender(<PostEditorForm />)
  expect(screen.getByLabelText("제목").matches(":disabled")).toBe(true)
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "본문" }).getAttribute("contenteditable")).toBe(
      "false",
    ),
  )
  expect(screen.getByRole("button", { name: "취소" }).matches(":disabled")).toBe(true)
  fireEvent.submit(container.querySelector("form")!)
  expect(state.mutate).not.toHaveBeenCalled()
})

it("preserves unsaved edits for the original owner when the session disappears", async () => {
  const { rerender } = render(<PostEditorForm />)
  await screen.findByRole("textbox", { name: "본문" })
  fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Last unsaved title" } })
  state.userId = null
  rerender(<PostEditorForm />)
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem("post-editor-draft:owner-1:new") ?? "null")?.title).toBe(
      "Last unsaved title",
    ),
  )
  expect(localStorage.getItem("post-editor-draft:anonymous:new")).toBeNull()
  expect(screen.getByLabelText("제목").matches(":disabled")).toBe(true)
  state.userId = "owner-2"
  rerender(<PostEditorForm />)
  expect(screen.getByLabelText("제목").matches(":disabled")).toBe(true)
  expect(localStorage.getItem("post-editor-draft:owner-2:new")).toBeNull()
})
