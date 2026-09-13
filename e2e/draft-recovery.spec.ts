import { randomUUID } from "node:crypto"

import { expect, test } from "./fixtures"
import { fillPostMetadata, openPostAdditionalSettings } from "./helpers/post-editor"

test("saved draft restores all authoring fields and can then be explicitly discarded", async ({
  page,
  actors,
  loginAs,
}) => {
  const draftKey = `post-editor-draft:${actors.owner.id}:new`
  const title = `Draft title ${randomUUID()}`
  const slug = `draft-${randomUUID()}`
  const description = "Draft summary survives reopening"
  const coverImage = "https://example.test/draft-cover.png"
  const tags = "draft, recovery"
  const body = "Draft editor body survives reopening"

  await loginAs(actors.owner)
  await page.goto("/")
  await page.goto("/posts/new")
  await fillPostMetadata(page, { title, slug, description, coverImage, tags })
  await page.getByRole("textbox", { name: "본문" }).fill(body)
  await page.getByRole("button", { name: "임시저장", exact: true }).click()

  await page.getByRole("button", { name: "취소", exact: true }).click()
  await page.getByRole("button", { name: "임시저장 후 나가기", exact: true }).click()
  await expect(page).toHaveURL("http://127.0.0.1:4317/")

  await page.goto("/posts/new")
  const restoreDialog = page.getByRole("dialog", { name: "임시저장 복원" })
  await expect(restoreDialog).toBeVisible()
  await restoreDialog.getByRole("button", { name: "복원하기", exact: true }).click()
  await openPostAdditionalSettings(page)
  await expect(page.getByLabel("제목")).toHaveValue(title)
  await expect(page.getByLabel("슬러그")).toHaveValue(slug)
  await expect(page.getByLabel("요약")).toHaveValue(description)
  await expect(page.getByLabel("커버 이미지 URL")).toHaveValue(coverImage)
  await expect(page.getByLabel("태그")).toHaveValue(tags)
  await expect(page.getByRole("textbox", { name: "본문" })).toContainText(body)

  await page.getByRole("button", { name: "취소", exact: true }).click()
  await page.getByRole("button", { name: "임시저장 후 나가기", exact: true }).click()
  await page.goto("/posts/new")
  const discardDialog = page.getByRole("dialog", { name: "임시저장 복원" })
  await discardDialog.getByRole("button", { name: "임시저장 폐기", exact: true }).click()
  await expect(page.getByLabel("제목")).toHaveValue("")
  await expect(page.getByRole("textbox", { name: "본문" })).toHaveText("")
  await expect(page.evaluate((key) => localStorage.getItem(key), draftKey)).resolves.toBeNull()
})

test("corrupt local draft blocks publishing until the owner explicitly discards it", async ({
  page,
  actors,
  loginAs,
}) => {
  const draftKey = `post-editor-draft:${actors.owner.id}:new`
  await loginAs(actors.owner)
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    draftKey,
    "{broken-json",
  ] as const)
  await page.goto("/posts/new")

  const dialog = page.getByRole("dialog", { name: "임시저장을 읽을 수 없어요" })
  await expect(dialog).toBeVisible()
  await expect(
    page.getByRole("button", { name: "발행", exact: true, includeHidden: true }),
  ).toBeDisabled()
  await dialog.getByRole("button", { name: "손상된 임시저장 폐기", exact: true }).click()
  await expect(page.getByRole("button", { name: "발행", exact: true })).toBeEnabled()
  await expect(page.evaluate((key) => localStorage.getItem(key), draftKey)).resolves.toBeNull()
})
