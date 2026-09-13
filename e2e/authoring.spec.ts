import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"

import { expect, test } from "./fixtures"
import { fillPostMetadata } from "./helpers/post-editor"

import type { SupabaseClient } from "@supabase/supabase-js"

async function readPost(database: SupabaseClient, slug: string) {
  const { data, error } = await database.from("posts").select("*").eq("slug", slug).maybeSingle()
  if (error) throw error
  return data
}

async function removePost(database: SupabaseClient, slug: string) {
  const { error } = await database.from("posts").delete().eq("slug", slug)
  if (error) throw error
}

async function removeImage(database: SupabaseClient, path: string) {
  const { error } = await database.storage.from("post-images").remove([path])
  if (error) throw error
}

function findDocumentNode(
  document: unknown,
  predicate: (node: Record<string, unknown>) => boolean,
) {
  const pending: unknown[] = [document]
  while (pending.length) {
    const value = pending.pop()
    if (!value || typeof value !== "object" || Array.isArray(value)) continue
    const node = value as Record<string, unknown>
    if (predicate(node)) return node
    if (Array.isArray(node.children)) pending.push(...node.children)
    if (node.root) pending.push(node.root)
  }
  return null
}

function storageObjectPath(requestUrl: string) {
  const marker = "/storage/v1/object/post-images/"
  const path = new URL(requestUrl).pathname.split(marker)[1]
  if (!path) throw new Error(`Could not read uploaded image path from ${requestUrl}`)
  return decodeURIComponent(path)
}

test("creates formatted text and an aligned image, then reopens the stored document through SSR", async ({
  page,
  browser,
  actors,
  loginAs,
  database,
}, testInfo) => {
  const slug = `e2e-rich-${randomUUID()}`
  const title = `Rich authoring ${randomUUID()}`
  const body = "Bold body survives serialization"
  const imageName = `editor-${randomUUID()}.png`
  const caption = "A saved image caption"
  const coverImage = "https://example.test/e2e-cover.png"
  let uploadedPath: string | null = null

  try {
    await loginAs(actors.owner)
    await page.goto("/posts/new")
    await fillPostMetadata(page, {
      title,
      slug,
      description: "Rich editor integration",
      coverImage,
      tags: "editor, integration",
    })

    const editor = page.getByRole("textbox", { name: "본문" })
    await editor.fill(body)
    await editor.press("ControlOrMeta+A")
    await page.locator(".jikjo-bubble-menu").getByRole("button", { name: "Bold" }).click()
    await expect(editor.locator("strong", { hasText: body })).toBeVisible()
    expect(await editor.evaluate(() => window.getSelection()?.toString())).toBe(body)
    await editor.press("ArrowRight")
    const collapsedSelection = await editor.evaluate(() => {
      const selection = window.getSelection()
      return {
        text: selection?.toString(),
        collapsed: selection?.isCollapsed,
        rangeCount: selection?.rangeCount,
      }
    })
    expect(collapsedSelection).toEqual({ text: "", collapsed: true, rangeCount: 1 })
    await editor.press("Enter")
    await expect(editor.locator("strong", { hasText: body })).toBeVisible()
    await editor.pressSequentially("/")
    await page.getByRole("option", { name: "Image", exact: true }).click()

    const uploadRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().includes("/storage/v1/object/post-images/"),
    )
    await page.locator('input[type="file"]').setInputFiles({
      name: imageName,
      mimeType: "image/png",
      buffer: await readFile(new URL("./fixtures/editor-image.png", import.meta.url)),
    })
    uploadedPath = storageObjectPath((await uploadRequestPromise).url())

    const editorImage = editor.getByRole("img", { name: imageName })
    await expect(editorImage).toBeVisible()
    await expect
      .poll(() => editorImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0)
    await editorImage.click()
    await page.getByRole("button", { name: "→", exact: true }).click()
    const imageLayout = await editorImage.evaluate((image) => {
      const figure = image.closest("figure")
      const wrapper = figure?.parentElement
      if (!figure || !wrapper) throw new Error("The editor image layout is incomplete.")
      const figureRect = figure.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()
      return {
        rightGap: Math.abs(wrapperRect.right - figureRect.right),
        figureWidth: figureRect.width,
        wrapperWidth: wrapperRect.width,
      }
    })
    expect(imageLayout.figureWidth).toBeLessThan(imageLayout.wrapperWidth)
    expect(imageLayout.rightGap).toBeLessThanOrEqual(1)
    const captionInput = page.getByPlaceholder("Caption (optional)")
    await captionInput.fill(caption)
    await captionInput.press("Tab")
    await editor.scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath("desktop-editor.png"), fullPage: false })

    await page.getByRole("button", { name: "발행", exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/posts/${slug}$`))

    const stored = await readPost(database, slug)
    expect(stored).not.toBeNull()
    expect(stored.cover_image).toBe(coverImage)
    expect(stored.tags).toEqual(["editor", "integration"])
    const document = JSON.parse(stored.content) as unknown
    const leftoverImageCommand = findDocumentNode(document, (node) => {
      if (node.type !== "paragraph" || !Array.isArray(node.children)) return false
      const text = node.children
        .map((child) =>
          child && typeof child === "object" && "text" in child
            ? String((child as { text: unknown }).text)
            : "",
        )
        .join("")
        .trim()
      return /^\/(?:image)?$/i.test(text)
    })
    expect(leftoverImageCommand).toBeNull()
    const textNode = findDocumentNode(
      document,
      (node) => node.type === "text" && node.text === body,
    )
    expect(textNode).not.toBeNull()
    expect((textNode?.format as number) & 1).toBe(1)
    const imageNode = findDocumentNode(
      document,
      (node) => node.type === "image" && node.alt === imageName,
    )
    expect(imageNode).toMatchObject({ alignment: "right", caption })
    expect(imageNode?.src).toContain(`/post-images/${uploadedPath}`)

    const publicContext = await browser.newContext({
      baseURL: "http://127.0.0.1:4317",
      javaScriptEnabled: false,
    })
    try {
      const publicPage = await publicContext.newPage()
      await publicPage.goto(`/posts/${slug}`)
      await expect(publicPage.getByRole("heading", { level: 1, name: title })).toBeVisible()
      await expect(publicPage.locator("strong", { hasText: body })).toBeVisible()
      const publicImage = publicPage.getByRole("img", { name: imageName })
      await expect(publicImage).toBeVisible()
      const publicImageLayout = await publicImage.evaluate((image) => {
        const figure = image.closest("figure")
        const content = image.closest(".post-content")
        if (!figure || !content) throw new Error("The published image layout is incomplete.")
        const figureRect = figure.getBoundingClientRect()
        const contentRect = content.getBoundingClientRect()
        return {
          rightGap: Math.abs(contentRect.right - figureRect.right),
          figureWidth: figureRect.width,
          contentWidth: contentRect.width,
        }
      })
      expect(publicImageLayout.figureWidth).toBeLessThan(publicImageLayout.contentWidth)
      expect(publicImageLayout.rightGap).toBeLessThanOrEqual(1)
      await expect(publicPage.getByText(caption, { exact: true })).toBeVisible()
      await expect(publicPage.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        coverImage,
      )
    } finally {
      await publicContext.close()
    }
  } finally {
    await removePost(database, slug)
    if (uploadedPath) await removeImage(database, uploadedPath)
  }
})

test("title-only inline and route edits preserve the exact serialized body", async ({
  page,
  actors,
  loginAs,
  createPost,
  database,
}) => {
  const post = await createPost()
  const originalContent = post.content
  await loginAs(actors.owner)

  await page.goto(`/posts/${post.slug}`)
  await page.getByRole("button", { name: "수정", exact: true }).click()
  const inlineEditor = page.getByRole("textbox", { name: "본문" })
  await expect(inlineEditor).toContainText("Original preserved body")
  await inlineEditor.press("ControlOrMeta+A")
  await page.getByRole("button", { name: "취소", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "편집을 종료할까요?" })).not.toBeVisible()
  await expect(page.getByRole("heading", { level: 1, name: post.title })).toBeVisible()

  await page.getByRole("button", { name: "수정", exact: true }).click()
  await expect(page.getByRole("textbox", { name: "본문" })).toContainText("Original preserved body")
  const inlineTitle = `Inline title ${randomUUID()}`
  await page.getByLabel("제목").fill(inlineTitle)
  await page.getByRole("button", { name: "수정 완료", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1, name: inlineTitle })).toBeVisible()
  expect((await readPost(database, post.slug))?.content).toBe(originalContent)

  await page.goto(`/posts/${post.slug}/edit`)
  await expect(page.getByRole("textbox", { name: "본문" })).toContainText("Original preserved body")
  const routeTitle = `Route title ${randomUUID()}`
  await page.getByLabel("제목").fill(routeTitle)
  await page.getByRole("button", { name: "수정 완료", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1, name: routeTitle })).toBeVisible()
  expect((await readPost(database, post.slug))?.content).toBe(originalContent)
})

test("duplicate slug failure preserves every input and succeeds after correction", async ({
  page,
  actors,
  loginAs,
  createPost,
  database,
}) => {
  const conflict = await createPost()
  const createdSlug = `e2e-retry-${randomUUID()}`
  const title = `Retry title ${randomUUID()}`
  const description = "Keep this summary after a failed request"
  const body = "Keep this editor body after a failed request"

  try {
    await loginAs(actors.owner)
    await page.goto("/posts/new")
    await fillPostMetadata(page, { title, slug: conflict.slug, description, tags: "retry, safe" })
    const editor = page.getByRole("textbox", { name: "본문" })
    await editor.fill(body)
    await page.getByRole("button", { name: "발행", exact: true }).click()

    await expect(page.getByRole("alert").filter({ hasText: "저장하지 못했습니다" })).toBeVisible()
    await expect(page.getByLabel("제목")).toHaveValue(title)
    await expect(page.getByLabel("슬러그")).toHaveValue(conflict.slug)
    await expect(page.getByLabel("요약")).toHaveValue(description)
    await expect(page.getByLabel("태그")).toHaveValue("retry, safe")
    await expect(editor).toContainText(body)

    await page.getByLabel("슬러그").fill(createdSlug)
    await page.getByRole("button", { name: "발행", exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/posts/${createdSlug}$`))
    const stored = await readPost(database, createdSlug)
    expect(stored).toMatchObject({ title, description, tags: ["retry", "safe"] })
    expect(stored.content).toContain(body)
  } finally {
    await removePost(database, createdSlug)
  }
})

test("owner deletion confirms in the UI and removes the article from the database", async ({
  page,
  actors,
  loginAs,
  createPost,
  database,
}) => {
  const post = await createPost()
  await loginAs(actors.owner)
  await page.goto(`/posts/${post.slug}`)

  await page.getByRole("button", { name: "게시글 삭제" }).click()
  const dialog = page.getByRole("dialog", { name: "게시글 삭제" })
  await expect(dialog).toContainText("삭제된 게시글은 복구할 수 없습니다")
  await dialog.getByRole("button", { name: "삭제", exact: true }).click()

  await expect(page).toHaveURL("http://127.0.0.1:4317/posts")
  await expect.poll(async () => readPost(database, post.slug)).toBeNull()
})

test("mobile action bar keeps controls and the active body caret visible without overflow", async ({
  page,
  actors,
  loginAs,
}, testInfo) => {
  await loginAs(actors.owner)
  await page.goto("/")

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 720 })
    await page.goto("/posts/new")
    const editor = page.getByRole("textbox", { name: "본문" })
    const visibleBody = `Visible body at ${width}px`
    await expect(editor).toBeVisible()
    const initialBody = await editor.boundingBox()
    const initialToolbar = await page
      .getByRole("toolbar", { name: "게시글 편집 작업" })
      .boundingBox()
    expect(
      initialBody!.y + 32,
      "writing starts above the fixed action bar without scrolling",
    ).toBeLessThan(initialToolbar!.y)
    await editor.click()
    await editor.pressSequentially(visibleBody)

    const toolbar = page.getByRole("toolbar", { name: "게시글 편집 작업" })
    await expect(toolbar).toBeVisible()
    const viewportMetrics = await page.evaluate(() => ({
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(viewportMetrics.innerWidth)
    for (const button of await toolbar.getByRole("button").all()) {
      const box = await button.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    }

    const textRect = await editor.evaluate((element, text) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      let textNode = walker.nextNode()
      while (textNode && !textNode.textContent?.includes(text)) textNode = walker.nextNode()
      if (!textNode?.textContent) throw new Error("The typed editor text is unavailable.")

      const end = textNode.textContent.indexOf(text) + text.length
      const range = document.createRange()
      range.setStart(textNode, end - 1)
      range.setEnd(textNode, end)
      const rect = range.getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom, height: rect.height }
    }, visibleBody)
    const headerBox = await page.locator("header").first().boundingBox()
    const toolbarBox = await toolbar.boundingBox()
    expect(headerBox).not.toBeNull()
    expect(toolbarBox).not.toBeNull()
    expect(textRect.height).toBeGreaterThan(0)
    expect(textRect.top).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height)
    expect(textRect.bottom).toBeLessThan(toolbarBox!.y)
    await expect(editor).toBeFocused()
    await page.screenshot({
      path: testInfo.outputPath(`mobile-action-bar-${width}.png`),
      fullPage: false,
    })
    await page.getByLabel("제목").fill("모바일 오류 위치 확인")
    await toolbar.getByRole("button", { name: "발행", exact: true }).click()
    const slug = page.getByLabel("슬러그")
    await expect(page.getByRole("button", { name: "부가 설정", exact: true })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    await expect(slug).toBeFocused()
    const invalidFieldBox = await slug.boundingBox()
    expect(invalidFieldBox!.y).toBeGreaterThanOrEqual(headerBox!.height)
    expect(invalidFieldBox!.y + invalidFieldBox!.height).toBeLessThan(toolbarBox!.y)
    await toolbar.getByRole("button", { name: "취소", exact: true }).click()
    await page.getByRole("button", { name: "폐기하고 나가기", exact: true }).click()
    await expect(page).toHaveURL("http://127.0.0.1:4317/")
  }
})
