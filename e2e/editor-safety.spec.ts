import { randomUUID } from "node:crypto"

import { expect, test } from "./fixtures"
import { openPostAdditionalSettings } from "./helpers/post-editor"

test("a stale editor cannot overwrite a body saved from another tab", async ({
  page,
  actors,
  database,
  loginAs,
  createPost,
}) => {
  const post = await createPost()
  const newerBody = `newer body ${randomUUID()}`
  const staleTitle = `stale title ${randomUUID()}`
  const stalePage = await page.context().newPage()

  try {
    await loginAs(actors.owner)
    await page.goto(`/posts/${post.slug}/edit`)
    await stalePage.goto(`/posts/${post.slug}/edit`)

    const currentEditor = page.getByRole("textbox", { name: "본문" })
    const staleEditor = stalePage.getByRole("textbox", { name: "본문" })
    await expect(currentEditor).toContainText("Original preserved body")
    await expect(staleEditor).toContainText("Original preserved body")

    await currentEditor.fill(newerBody)
    await page.getByRole("button", { name: "수정 완료", exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/posts/${post.slug}$`))
    await expect
      .poll(async () => {
        const { data, error } = await database
          .from("posts")
          .select("content")
          .eq("id", post.id)
          .single()
        if (error) throw error
        return data.content
      })
      .toContain(newerBody)

    await stalePage.getByLabel("제목").fill(staleTitle)
    await stalePage.getByRole("button", { name: "수정 완료", exact: true }).click()

    await expect(stalePage.getByRole("alert")).toContainText(
      "다른 곳에서 게시글이 먼저 수정되었습니다.",
    )
    await expect(stalePage).toHaveURL(new RegExp(`/posts/${post.slug}/edit$`))
    await expect(stalePage.getByLabel("제목")).toHaveValue(staleTitle)
    await expect(staleEditor).toContainText("Original preserved body")
    const { data: preserved, error: preservedError } = await database
      .from("posts")
      .select("title, content")
      .eq("id", post.id)
      .single()
    if (preservedError) throw preservedError
    expect(preserved.title).not.toBe(staleTitle)
    expect(preserved.content).toContain(newerBody)
  } finally {
    await stalePage.close()
  }
})

test("internal navigation offers to keep or discard unsaved editor changes", async ({
  page,
  actors,
  database,
  loginAs,
  createPost,
}) => {
  const post = await createPost()
  const originalContent = post.content
  const draftTitle = `navigation draft ${randomUUID()}`
  const draftBody = `navigation body ${randomUUID()}`

  await loginAs(actors.owner)
  await page.goto(`/posts/${post.slug}/edit`)
  await page.getByLabel("제목").fill(draftTitle)
  await page.getByRole("textbox", { name: "본문" }).fill(draftBody)

  const postsLink = page
    .getByRole("navigation", { name: "주요 메뉴" })
    .getByRole("link", { name: "Posts", exact: true })
  await postsLink.click()
  const keepDialog = page.getByRole("dialog", { name: "편집을 종료할까요?" })
  await expect(keepDialog).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/posts/${post.slug}/edit$`))
  await keepDialog.getByRole("button", { name: "임시저장 후 나가기", exact: true }).click()
  await expect(page).toHaveURL(/\/posts\/?$/)

  await page.goto(`/posts/${post.slug}/edit`)
  const restoreDialog = page.getByRole("dialog", { name: "임시저장 복원" })
  await expect(restoreDialog).toBeVisible()
  await restoreDialog.getByRole("button", { name: "복원하기", exact: true }).click()
  await expect(page.getByLabel("제목")).toHaveValue(draftTitle)
  await expect(page.getByRole("textbox", { name: "본문" })).toContainText(draftBody)

  await postsLink.click()
  const discardDialog = page.getByRole("dialog", { name: "편집을 종료할까요?" })
  await expect(discardDialog).toBeVisible()
  await discardDialog.getByRole("button", { name: "폐기하고 나가기", exact: true }).click()
  await expect(page).toHaveURL(/\/posts\/?$/)

  const { data: preserved, error } = await database
    .from("posts")
    .select("title, content")
    .eq("id", post.id)
    .single()
  if (error) throw error
  expect(preserved.title).toBe(post.title)
  expect(preserved.content).toBe(originalContent)

  await page.goto(`/posts/${post.slug}/edit`)
  await expect(page.getByRole("dialog", { name: "임시저장 복원" })).toHaveCount(0)
  await expect(page.getByRole("textbox", { name: "본문" })).toContainText("Original preserved body")
})

test("renaming a slug makes the old browser-history URL return 404", async ({
  page,
  actors,
  database,
  loginAs,
  createPost,
}) => {
  const post = await createPost()
  const renamedSlug = `renamed-${randomUUID()}`

  await loginAs(actors.owner)
  await page.goto(`/posts/${post.slug}`)
  await page.getByRole("button", { name: "수정", exact: true }).click()
  await openPostAdditionalSettings(page)
  await page.getByLabel("슬러그").fill(renamedSlug)
  await page.getByRole("button", { name: "수정 완료", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/posts/${renamedSlug}$`))
  await expect
    .poll(async () => {
      const { data, error } = await database.from("posts").select("slug").eq("id", post.id).single()
      if (error) throw error
      return data.slug
    })
    .toBe(renamedSlug)

  await page.goBack()
  await expect(page).toHaveURL(new RegExp(`/posts/${post.slug}$`))
  await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible()

  const oldUrlResponse = await page.reload()
  expect(oldUrlResponse?.status()).toBe(404)
})
