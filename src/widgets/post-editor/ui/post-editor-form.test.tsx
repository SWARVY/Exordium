import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PostEditorForm } from "./post-editor-form"

import type { Post } from "@entities/post"

vi.mock("@features/create-post", () => ({
  useCreatePost: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}))

vi.mock("@features/update-post", () => ({
  PostUpdateConflictError: class PostUpdateConflictError extends Error {},
  useUpdatePost: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
}))

vi.mock("@shared/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "owner-1" }, isLoading: false }),
}))

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useBlocker: () => ({ status: "idle" }),
  }
})

const ORIGINAL_DOCUMENT = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Existing article body",
            type: "text",
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
})

const post: Post = {
  id: "post-1",
  slug: "existing-post",
  title: "Existing post",
  description: "Existing summary",
  content: ORIGINAL_DOCUMENT,
  coverImage: "https://example.com/cover.webp",
  tags: ["react", "testing"],
  publishedAt: "2026-09-11T00:00:00.000Z",
  createdAt: "2026-09-11T00:00:00.000Z",
  updatedAt: "2026-09-11T00:00:00.000Z",
}

describe("PostEditorForm", () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it("initializes the real Jikjo editor with the stored post document", async () => {
    render(<PostEditorForm post={post} />)

    expect(await screen.findByText("Existing article body")).not.toBeNull()
    expect(screen.getByRole("textbox", { name: "본문" })).not.toBeNull()
  })

  it("requires an explicit choice before restoring an edit draft", async () => {
    localStorage.setItem(
      "post-editor-draft:owner-1:post-1",
      JSON.stringify({
        version: 1,
        title: "Recovered title",
        description: "Recovered summary",
        slug: "recovered-title",
        content: ORIGINAL_DOCUMENT.replace("Existing article body", "Recovered article body"),
        coverImage: "https://example.com/recovered.webp",
        tags: ["recovered", "draft"],
        baseUpdatedAt: post.updatedAt,
        savedAt: "2026-09-11T09:30:00.000Z",
      }),
    )

    render(<PostEditorForm post={post} />)

    expect(await screen.findByRole("dialog", { name: "임시저장 복원" })).not.toBeNull()
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe("Existing post")

    fireEvent.click(screen.getByRole("button", { name: "복원하기" }))

    expect(await screen.findByText("Recovered article body")).not.toBeNull()
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe("Recovered title")
    expect((screen.getByLabelText("커버 이미지 URL") as HTMLInputElement).value).toBe(
      "https://example.com/recovered.webp",
    )
    expect((screen.getByLabelText("태그") as HTMLInputElement).value).toBe("recovered, draft")
  })

  it("blocks publishing until a malformed local draft is explicitly discarded", async () => {
    localStorage.setItem("post-editor-draft:owner-1:post-1", "{broken")

    const { container } = render(<PostEditorForm post={post} />)

    expect(await screen.findByRole("dialog", { name: "임시저장을 읽을 수 없어요" })).not.toBeNull()
    expect((container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(
      true,
    )

    fireEvent.click(screen.getByRole("button", { name: "손상된 임시저장 폐기" }))

    expect(screen.queryByRole("dialog", { name: "임시저장을 읽을 수 없어요" })).toBeNull()
    expect((screen.getByRole("button", { name: "수정 완료" }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })

  it("asks whether to keep or discard unsaved edits before cancelling", async () => {
    render(<PostEditorForm post={post} />)
    await screen.findByText("Existing article body")

    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Changed title" } })
    fireEvent.click(screen.getByRole("button", { name: "취소" }))

    expect(screen.getByRole("dialog", { name: "편집을 종료할까요?" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "임시저장 후 나가기" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "폐기하고 나가기" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "계속 편집" })).not.toBeNull()
  })

  it("keeps a trailing comma while the author enters another tag", async () => {
    render(<PostEditorForm post={post} />)
    await screen.findByText("Existing article body")
    const tags = screen.getByLabelText("태그") as HTMLInputElement

    fireEvent.change(tags, { target: { value: "react," } })

    expect(tags.value).toBe("react,")
  })

  it("keeps additional settings values when the disclosure closes and reopens", async () => {
    render(<PostEditorForm post={post} />)
    await screen.findByText("Existing article body")

    const disclosure = screen.getByRole("button", { name: "부가 설정" })
    const title = screen.getByLabelText("제목")
    const editor = screen.getByRole("textbox", { name: "본문" })
    expect(title.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      editor.compareDocumentPosition(disclosure) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(disclosure.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(disclosure)

    const slug = screen.getByLabelText("슬러그") as HTMLInputElement
    fireEvent.change(slug, { target: { value: "preserved-slug" } })
    fireEvent.click(disclosure)
    expect(disclosure.getAttribute("aria-expanded")).toBe("false")

    fireEvent.click(disclosure)
    await waitFor(() => expect(disclosure.getAttribute("aria-expanded")).toBe("true"))
    expect((screen.getByLabelText("슬러그") as HTMLInputElement).value).toBe("preserved-slug")
  })

  it("opens additional settings when a hidden slug has a validation error", async () => {
    render(<PostEditorForm />)
    await screen.findByRole("textbox", { name: "본문" })
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Valid title" } })
    fireEvent.change(screen.getByLabelText("요약"), { target: { value: "Valid summary" } })

    const disclosure = screen.getByRole("button", { name: "부가 설정" })
    expect(disclosure.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(screen.getByRole("button", { name: "발행" }))

    await waitFor(() => expect(disclosure.getAttribute("aria-expanded")).toBe("true"))
    const slug = screen.getByLabelText("슬러그")
    const error = await screen.findByText("슬러그를 입력하세요")
    expect(slug.getAttribute("aria-invalid")).toBe("true")
    expect(slug.getAttribute("aria-describedby")).toBe(error.id)
    await waitFor(() => expect(document.activeElement).toBe(slug))
  })

  it("restores every published field when a recovered document cannot be initialized", async () => {
    localStorage.setItem(
      "post-editor-draft:owner-1:post-1",
      JSON.stringify({
        version: 1,
        title: "Unsafe recovered title",
        description: "Unsafe summary",
        slug: "unsafe-title",
        content: "{broken",
        coverImage: "https://example.com/unsafe.webp",
        tags: ["unsafe"],
        baseUpdatedAt: post.updatedAt,
        savedAt: "2026-09-11T09:30:00.000Z",
      }),
    )
    render(<PostEditorForm post={post} />)
    fireEvent.click(await screen.findByRole("button", { name: "복원하기" }))
    fireEvent.click(await screen.findByRole("button", { name: "임시저장 폐기하고 원문 사용" }))

    expect(await screen.findByText("Existing article body")).not.toBeNull()
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe("Existing post")
    expect((screen.getByLabelText("태그") as HTMLInputElement).value).toBe("react, testing")
  })

  it("connects visible validation messages to invalid metadata fields", async () => {
    render(<PostEditorForm />)
    const publish = await screen.findByRole("button", { name: "발행" })
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "   " } })
    fireEvent.change(screen.getByLabelText("요약"), { target: { value: "   " } })
    fireEvent.change(screen.getByLabelText("슬러그"), { target: { value: "blank-metadata" } })

    fireEvent.click(publish)

    const title = screen.getByLabelText("제목")
    const error = await screen.findByText("제목을 입력하세요")
    expect(error.textContent).toContain("제목을 입력하세요")
    expect(title.getAttribute("aria-invalid")).toBe("true")
    expect(title.getAttribute("aria-describedby")).toBe(error.id)
    expect(screen.getByText("요약을 입력하세요")).not.toBeNull()
  })

  it("blocks a metadata-only publish and connects the body error to the editor", async () => {
    const { container } = render(<PostEditorForm />)
    await screen.findByRole("textbox", { name: "본문" })
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Metadata only" } })
    fireEvent.change(screen.getByLabelText("슬러그"), { target: { value: "metadata-only" } })
    fireEvent.change(screen.getByLabelText("요약"), { target: { value: "Missing body" } })

    fireEvent.click(screen.getByRole("button", { name: "발행" }))

    expect(await screen.findByText("본문을 입력하세요.")).not.toBeNull()
    const editorWrapper = container.querySelector(".post-editor-wrap")
    expect(editorWrapper?.getAttribute("aria-invalid")).toBe("true")
    expect(editorWrapper?.getAttribute("aria-describedby")).toBe("post-editor-error")
  })

  it("preserves a draft from an older post version but blocks it from overwriting the latest body", async () => {
    const draftKey = "post-editor-draft:owner-1:post-1"
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        version: 1,
        title: "Older draft",
        description: "Older summary",
        slug: post.slug,
        content: ORIGINAL_DOCUMENT.replace("Existing article body", "Older draft body"),
        coverImage: "",
        tags: [],
        baseUpdatedAt: "2026-09-10T00:00:00.000Z",
        savedAt: "2026-09-11T09:30:00.000Z",
      }),
    )
    render(<PostEditorForm post={post} />)

    fireEvent.click(await screen.findByRole("button", { name: "복원하기" }))

    expect(await screen.findByText("Older draft body")).not.toBeNull()
    expect(screen.getByRole("alert").textContent).toContain(
      "다른 곳에서 게시글이 먼저 수정되었습니다",
    )
    expect((screen.getByRole("button", { name: "수정 완료" }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(localStorage.getItem(draftKey)).not.toBeNull()
  })
})
