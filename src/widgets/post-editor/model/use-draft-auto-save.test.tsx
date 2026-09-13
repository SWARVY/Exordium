import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useDraftAutoSave } from "./use-draft-auto-save"

const draft = {
  title: "Draft title",
  description: "Draft summary",
  content: '{"root":{"type":"root","children":[]}}',
  slug: "draft-title",
  coverImage: "https://example.com/cover.webp",
  tags: ["react", "draft"],
}
const draftKey = "post-editor-draft:owner-1:new"

describe("useDraftAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-11T09:30:00.000Z"))
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it("returns the saved timestamp and persists all authoring fields", () => {
    const { result } = renderHook(() => useDraftAutoSave(() => draft, undefined, {}, "owner-1"))

    let saved: unknown
    act(() => {
      saved = result.current.saveDraft()
    })

    expect(saved).toEqual({ status: "saved", savedAt: "2026-09-11T09:30:00.000Z" })
    expect(JSON.parse(localStorage.getItem(draftKey) ?? "null")).toEqual({
      version: 1,
      ...draft,
      savedAt: "2026-09-11T09:30:00.000Z",
    })
  })

  it("reports malformed stored JSON instead of silently treating it as no draft", () => {
    localStorage.setItem(draftKey, "{broken")
    const { result } = renderHook(() => useDraftAutoSave(() => draft, undefined, {}, "owner-1"))

    expect(result.current.loadDraft()).toEqual({ status: "corrupt" })
  })

  it("reports storage access failures without throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is unavailable", "SecurityError")
    })
    const { result } = renderHook(() => useDraftAutoSave(() => draft, undefined, {}, "owner-1"))

    expect(() => result.current.loadDraft()).not.toThrow()
    expect(result.current.loadDraft()).toEqual({ status: "unavailable" })
  })

  it("reports the current timestamp after an automatic save", () => {
    const onSaved = vi.fn()
    renderHook(() => useDraftAutoSave(() => draft, undefined, { onSaved }, "owner-1"))

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(onSaved).toHaveBeenCalledWith("2026-09-11T09:30:30.000Z")
  })

  it("does not expose one owner's draft through another owner's key", () => {
    const first = renderHook(() => useDraftAutoSave(() => draft, undefined, {}, "owner-1"))
    act(() => {
      first.result.current.saveDraft()
    })
    const second = renderHook(() => useDraftAutoSave(() => draft, undefined, {}, "owner-2"))

    expect(second.result.current.loadDraft()).toEqual({ status: "empty" })
  })
  it("offers a legacy draft without assigning it to an owner until explicitly saved", () => {
    const legacy = JSON.stringify({ ...draft, savedAt: "2026-09-11T09:30:00.000Z" })
    localStorage.setItem("post-editor-draft", legacy)
    const { result } = renderHook(() =>
      useDraftAutoSave(() => draft, undefined, { enabled: false }, "owner-1"),
    )
    expect(result.current.loadDraft()).toMatchObject({ status: "ready", legacy: true, draft })
    expect(localStorage.getItem(draftKey)).toBeNull()
    expect(localStorage.getItem("post-editor-draft")).toBe(legacy)
    act(() => {
      result.current.saveDraft()
    })
    expect(JSON.parse(localStorage.getItem(draftKey) ?? "null")).toMatchObject(draft)
    expect(localStorage.getItem("post-editor-draft")).toBeNull()
  })
})
