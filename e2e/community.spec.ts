import { randomUUID } from "node:crypto"

import { expect, test } from "./fixtures"

import type { Route } from "@playwright/test"

test("a reader can publish a comment and reply that survive reload", async ({
  page,
  actors,
  database,
  loginAs,
  createPost,
}) => {
  const post = await createPost()
  const commentText = `reader comment ${randomUUID()}`
  const replyText = `reader reply ${randomUUID()}`

  await loginAs(actors.reader)
  await page.goto(`/posts/${post.slug}`)

  const comments = page.getByRole("region", { name: "댓글" })
  await comments.getByRole("textbox", { name: "댓글" }).fill(commentText)
  await comments.getByRole("button", { name: "등록", exact: true }).click()

  const rootComment = comments.getByRole("article").filter({ hasText: commentText })
  await expect(rootComment).toBeVisible()
  await rootComment.getByRole("button", { name: "답글", exact: true }).click()
  const replyInput = rootComment.getByRole("textbox", { name: "댓글" })
  await replyInput.fill(replyText)
  await rootComment.getByRole("button", { name: "답글", exact: true }).click()
  await expect(replyInput).toHaveCount(0)
  await expect(rootComment.locator("p").filter({ hasText: replyText })).toHaveText(replyText)
  await expect
    .poll(async () => {
      const { count, error } = await database
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id)
        .eq("content", replyText)
        .not("parent_id", "is", null)
      if (error) throw error
      return count
    })
    .toBe(1)

  await page.reload()

  const reloadedComments = page.getByRole("region", { name: "댓글" })
  await expect(reloadedComments.getByText(commentText, { exact: true })).toBeVisible()
  await expect(reloadedComments.getByText(replyText, { exact: true })).toBeVisible()
})

test("a reaction is not shown as pressed after switching to another reader", async ({
  page,
  actors,
  database,
  loginAs,
  createPost,
}) => {
  const post = await createPost()

  await loginAs(actors.reader)
  await page.goto(`/posts/${post.slug}`)

  const thumbsUp = page.getByRole("button", { name: /^👍(?:\s|$)/ }).first()
  await expect(thumbsUp).toHaveAttribute("aria-pressed", "false")
  await thumbsUp.click()
  await expect(thumbsUp).toHaveAttribute("aria-pressed", "true")
  await expect
    .poll(async () => {
      const { data, error } = await database
        .from("post_reactions")
        .select("user_id, emoji")
        .eq("post_id", post.id)
        .eq("emoji", "👍")
      if (error) throw error
      return data
    })
    .toEqual([{ user_id: actors.reader.id, emoji: "👍" }])

  await loginAs(actors.other)
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")))

  await expect(thumbsUp).toHaveAttribute("aria-pressed", "false")
  await expect(thumbsUp).toContainText("1")
})

test("the owner can delete another reader's root comment and its replies", async ({
  page,
  actors,
  database,
  loginAs,
  createPost,
}) => {
  const post = await createPost()
  const rootText = `moderated root ${randomUUID()}`
  const replyText = `cascaded reply ${randomUUID()}`
  const { data: rootComment, error: rootError } = await database
    .from("comments")
    .insert({
      post_id: post.id,
      parent_id: null,
      author_id: actors.reader.id,
      author_name: "E2E reader",
      content: rootText,
    })
    .select("id")
    .single()
  if (rootError) throw rootError

  const { data: reply, error: replyError } = await database
    .from("comments")
    .insert({
      post_id: post.id,
      parent_id: rootComment.id,
      author_id: actors.reader.id,
      author_name: "E2E reader",
      content: replyText,
    })
    .select("id")
    .single()
  if (replyError) throw replyError

  await loginAs(actors.owner)
  await page.goto(`/posts/${post.slug}`)

  const comments = page.getByRole("region", { name: "댓글" })
  const rootArticle = comments.getByRole("article").filter({ hasText: rootText })
  await expect(rootArticle.getByText(replyText, { exact: true })).toBeVisible()
  await rootArticle.getByRole("button", { name: "댓글 삭제", exact: true }).click()

  const dialog = page.getByRole("dialog", { name: "댓글 삭제" })
  await expect(dialog).toContainText("답글 1개도 함께 삭제됩니다")
  await dialog.getByRole("button", { name: "삭제", exact: true }).click()

  await expect(comments.getByText(rootText, { exact: true })).toHaveCount(0)
  await expect(comments.getByText(replyText, { exact: true })).toHaveCount(0)
  await expect
    .poll(async () => {
      const { data, error } = await database
        .from("comments")
        .select("id")
        .in("id", [rootComment.id, reply.id])
      if (error) throw error
      return data.length
    })
    .toBe(0)
})

test("a failed comment submission preserves the input and can be retried", async ({
  page,
  actors,
  database,
  loginAs,
  createPost,
}) => {
  const post = await createPost()
  const commentText = `retry comment ${randomUUID()}`

  await loginAs(actors.reader)
  await page.goto(`/posts/${post.slug}`)

  let shouldFail = true
  const failFirstCommentWrite = async (route: Route) => {
    if (route.request().method() === "POST" && shouldFail) {
      shouldFail = false
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "PGRST999",
          details: null,
          hint: null,
          message: "일시적인 댓글 저장 오류",
        }),
      })
      return
    }
    await route.continue()
  }
  await page.route("**/rest/v1/comments*", failFirstCommentWrite)

  const comments = page.getByRole("region", { name: "댓글" })
  const input = comments.getByRole("textbox", { name: "댓글" })
  await input.fill(commentText)
  await comments.getByRole("button", { name: "등록", exact: true }).click()

  await expect(comments.getByRole("alert")).toContainText("일시적인 댓글 저장 오류")
  await expect(input).toHaveValue(commentText)
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute("aria-invalid", "true")

  await page.unroute("**/rest/v1/comments*", failFirstCommentWrite)
  await comments.getByRole("button", { name: "등록", exact: true }).click()

  await expect(comments.getByText(commentText, { exact: true })).toBeVisible()
  await expect(input).toHaveValue("")
  await expect
    .poll(async () => {
      const { count, error } = await database
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id)
        .eq("content", commentText)
      if (error) throw error
      return count
    })
    .toBe(1)
})

test("the owner can update the posts subtitle and it survives reload", async ({
  page,
  actors,
  database,
  loginAs,
}) => {
  const { data: originalRow, error: originalError } = await database
    .from("site_config")
    .select("value")
    .eq("key", "posts_subtitle")
    .single()
  if (originalError) throw originalError

  const updatedSubtitle = `E2E subtitle ${randomUUID()}`

  try {
    await loginAs(actors.owner)
    await page.goto("/posts")
    await page.getByRole("button", { name: "부제목 수정" }).click()

    const subtitleInput = page.getByRole("textbox", { name: "부제목" })
    await subtitleInput.fill(updatedSubtitle)
    await page.getByRole("button", { name: "저장", exact: true }).click()
    await expect(subtitleInput).toHaveCount(0)
    await expect(page.getByText(updatedSubtitle, { exact: true })).toBeVisible()
    await expect
      .poll(async () => {
        const { data, error } = await database
          .from("site_config")
          .select("value")
          .eq("key", "posts_subtitle")
          .single()
        if (error) throw error
        return data.value
      })
      .toBe(updatedSubtitle)

    await page.reload()
    await expect(page.getByText(updatedSubtitle, { exact: true })).toBeVisible()
  } finally {
    const { error: restoreError } = await database
      .from("site_config")
      .update({ value: originalRow.value, updated_at: new Date().toISOString() })
      .eq("key", "posts_subtitle")
    expect.soft(restoreError, "posts subtitle cleanup should succeed").toBeNull()
  }
})
