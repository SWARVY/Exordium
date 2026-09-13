import { randomUUID } from "node:crypto"

import { expect, test } from "./fixtures"

import type { SupabaseClient } from "@supabase/supabase-js"

interface ProjectRow {
  id: string
  name: string
  repo_url: string
}

async function findProject(database: SupabaseClient, repoUrl: string) {
  const { data, error } = await database
    .from("open_source")
    .select("id,name,repo_url")
    .eq("repo_url", repoUrl)
    .maybeSingle()
  if (error) throw error
  return data as ProjectRow | null
}

test("owner creates, searches, renames, and confirms deletion of a project", async ({
  page,
  database,
  actors,
  loginAs,
}) => {
  const suffix = randomUUID().slice(0, 8)
  const originalName = `E2E CRUD Original ${suffix}`
  const updatedName = `E2E CRUD Updated ${suffix}`
  const description = `CRUD lifecycle project ${suffix}`
  const repoUrl = `https://example.com/e2e-crud-${suffix}`

  try {
    await loginAs(actors.owner)
    await page.goto("/projects")

    await page.getByRole("button", { name: "추가", exact: true }).click()
    const createDialog = page.getByRole("dialog")
    await expect(createDialog.getByRole("heading", { name: "— Add Project" })).toBeVisible()
    await createDialog.getByLabel("이름", { exact: true }).fill(originalName)
    await createDialog.getByLabel("설명", { exact: true }).fill(description)
    await createDialog.getByLabel("저장소 URL", { exact: true }).fill(repoUrl)
    await createDialog.getByLabel(/언어/).fill("TypeScript")
    await createDialog.getByRole("button", { name: "저장", exact: true }).click()

    await expect(page.getByRole("heading", { level: 2, name: originalName })).toBeVisible()
    await expect.poll(async () => (await findProject(database, repoUrl))?.name).toBe(originalName)

    await page.getByRole("button", { name: "검색 열기" }).click()
    const searchDialog = page.getByRole("dialog")
    await searchDialog.getByRole("searchbox", { name: "검색" }).fill(originalName)
    await expect(searchDialog.getByRole("link", { name: new RegExp(originalName) })).toBeVisible()
    await searchDialog.getByRole("button", { name: "검색 닫기" }).click()

    const projectCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { level: 2, name: originalName }) })
    await projectCard.getByRole("button", { name: "수정", exact: true }).click()
    const editDialog = page.getByRole("dialog")
    await expect(editDialog.getByRole("heading", { name: "— Edit Project" })).toBeVisible()
    await editDialog.getByLabel("이름", { exact: true }).fill(updatedName)
    await editDialog.getByRole("button", { name: "저장", exact: true }).click()

    await expect(page.getByRole("heading", { level: 2, name: updatedName })).toBeVisible()
    await expect.poll(async () => (await findProject(database, repoUrl))?.name).toBe(updatedName)

    await page.getByRole("button", { name: "검색 열기" }).click()
    const updatedSearch = page.getByRole("dialog")
    const searchbox = updatedSearch.getByRole("searchbox", { name: "검색" })
    await searchbox.fill(originalName)
    await expect(updatedSearch.getByText(`"${originalName}"에 대한 결과가 없습니다.`)).toBeVisible()
    await searchbox.fill(updatedName)
    await expect(updatedSearch.getByRole("link", { name: new RegExp(updatedName) })).toBeVisible()
    await updatedSearch.getByRole("button", { name: "검색 닫기" }).click()

    const updatedCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { level: 2, name: updatedName }) })
    await updatedCard.getByRole("button", { name: `${updatedName} 삭제` }).click()
    const cancelDialog = page.getByRole("dialog")
    await expect(
      cancelDialog.getByRole("heading", { name: `${updatedName} 프로젝트 삭제` }),
    ).toBeVisible()
    await expect(
      cancelDialog.getByText("삭제한 프로젝트는 복구할 수 없습니다. 정말 삭제하시겠습니까?"),
    ).toBeVisible()
    await cancelDialog.getByRole("button", { name: "취소", exact: true }).click()
    await expect(cancelDialog).not.toBeVisible()
    expect((await findProject(database, repoUrl))?.name).toBe(updatedName)

    await updatedCard.getByRole("button", { name: `${updatedName} 삭제` }).click()
    const confirmDialog = page.getByRole("dialog")
    await confirmDialog.getByRole("button", { name: "삭제", exact: true }).click()

    await expect.poll(async () => findProject(database, repoUrl)).toBeNull()
    await expect(page.getByRole("heading", { level: 2, name: updatedName })).not.toBeVisible()
  } finally {
    const { error } = await database.from("open_source").delete().eq("repo_url", repoUrl)
    if (error) throw error
  }
})
