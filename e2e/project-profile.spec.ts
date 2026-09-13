import { randomUUID } from "node:crypto"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getLocalStack } from "../scripts/local-stack"
import { expect, test, type Actor } from "./fixtures"

interface ProfileRow {
  id: string
  name: string
  bio: string
  avatar_url: string | null
  github_url: string | null
  twitter_url: string | null
  website_url: string | null
  skills: string[]
  created_at: string
  updated_at: string
}

interface ProjectRow {
  id: string
  name: string
  description: string
  repo_url: string
  language: string | null
  order: number
  created_at: string
  updated_at: string
}

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
)
const redPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2mAAAAABJRU5ErkJggg==",
  "base64",
)

async function getProfile(database: SupabaseClient) {
  const { data, error } = await database.from("owner_profile").select("*").single()
  if (error) throw error
  return data as ProfileRow
}

async function restoreProfile(database: SupabaseClient, profile: ProfileRow) {
  const { id, ...values } = profile
  const { error } = await database.from("owner_profile").update(values).eq("id", id)
  if (error) throw error
}

async function getProjects(database: SupabaseClient) {
  const { data, error } = await database
    .from("open_source")
    .select("*")
    .order("order", { ascending: true })
    .order("id", { ascending: true })
  if (error) throw error
  return data as ProjectRow[]
}

async function insertProjects(database: SupabaseClient, names: string[]) {
  const existing = await getProjects(database)
  const lastOrder = existing.reduce((maximum, project) => Math.max(maximum, project.order), -1)
  const { data, error } = await database
    .from("open_source")
    .insert(
      names.map((name, index) => ({
        name,
        description: `E2E project ${name}`,
        repo_url: `https://example.com/${encodeURIComponent(name)}`,
        language: "TypeScript",
        order: lastOrder + index + 1,
      })),
    )
    .select("*")
  if (error) throw error
  return data as ProjectRow[]
}

async function restoreProjects(
  database: SupabaseClient,
  baseline: ProjectRow[],
  insertedIds: string[],
) {
  if (insertedIds.length > 0) {
    const { error } = await database.from("open_source").delete().in("id", insertedIds)
    if (error) throw error
  }
  for (const project of baseline) {
    const { error } = await database
      .from("open_source")
      .update({ order: project.order, updated_at: project.updated_at })
      .eq("id", project.id)
    if (error) throw error
  }
}

async function createActorClient(actor: Actor) {
  const stack = getLocalStack()
  const client = createClient(stack.url, stack.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: actor.email,
    password: actor.password,
  })
  if (error) throw error
  return client
}

function avatarPath(publicUrl: string) {
  const marker = "/storage/v1/object/public/avatars/"
  const pathname = new URL(publicUrl).pathname
  const markerIndex = pathname.indexOf(marker)
  if (markerIndex < 0) throw new Error(`Unexpected avatar URL: ${publicUrl}`)
  return decodeURIComponent(pathname.slice(markerIndex + marker.length))
}

async function downloadBytes(database: SupabaseClient, path: string) {
  const { data, error } = await database.storage.from("avatars").download(path)
  if (error) throw error
  return Buffer.from(await data.arrayBuffer())
}

async function projectNames(page: import("@playwright/test").Page) {
  return page.locator("article h2").allTextContents()
}

test("cancelling a staged avatar preserves the published URL and bytes and removes only the staged file", async ({
  page,
  database,
  actors,
  loginAs,
}) => {
  const baseline = await getProfile(database)
  const baselinePath = `profile/e2e-baseline-${randomUUID()}.png`
  let stagedPath: string | null = null

  try {
    const { error: uploadError } = await database.storage
      .from("avatars")
      .upload(baselinePath, transparentPng, { contentType: "image/png" })
    if (uploadError) throw uploadError
    const baselineUrl = database.storage.from("avatars").getPublicUrl(baselinePath).data.publicUrl
    const { error: profileError } = await database
      .from("owner_profile")
      .update({ avatar_url: baselineUrl })
      .eq("id", baseline.id)
    if (profileError) throw profileError

    await loginAs(actors.owner)
    await page.goto("/")
    await expect(page.getByRole("link", { name: "새 게시글 작성" })).toBeVisible()
    await page.getByRole("button", { name: "Edit Profile" }).click()
    await expect(page.getByRole("link", { name: "새 게시글 작성" })).not.toBeVisible()
    const droppedImage = await page.evaluateHandle(
      (bytes) => {
        const transfer = new DataTransfer()
        transfer.items.add(
          new File([new Uint8Array(bytes)], "replacement.png", { type: "image/png" }),
        )
        return transfer
      },
      [...redPng],
    )
    await page
      .getByRole("button", { name: "프로필 이미지 업로드" })
      .dispatchEvent("drop", { dataTransfer: droppedImage })
    await droppedImage.dispose()
    await expect(
      page.getByText("새 이미지가 준비되었습니다. 저장하면 공개 프로필에 반영됩니다."),
    ).toBeVisible()
    const preview = page.getByRole("img", { name: "avatar preview" })
    await expect
      .poll(() =>
        preview.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true)
    const stagedUrl = await preview.getAttribute("src")
    expect(stagedUrl).not.toBeNull()
    stagedPath = avatarPath(stagedUrl!)
    expect(stagedPath).not.toBe(baselinePath)

    await page.getByRole("button", { name: "취소", exact: true }).click()
    await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible()
    await expect(page.getByRole("link", { name: "새 게시글 작성" })).toBeVisible()

    const published = await getProfile(database)
    expect(published.avatar_url).toBe(baselineUrl)
    expect(await downloadBytes(database, baselinePath)).toEqual(transparentPng)
    const stagedDownload = await database.storage.from("avatars").download(stagedPath)
    expect(stagedDownload.data).toBeNull()
    expect(stagedDownload.error).not.toBeNull()
  } finally {
    await restoreProfile(database, baseline)
    const paths = [baselinePath, stagedPath].filter((path): path is string => Boolean(path))
    const { error } = await database.storage.from("avatars").remove(paths)
    if (error) throw error
  }
})

test("saving a staged avatar persists its unique URL and exact uploaded bytes", async ({
  page,
  database,
  actors,
  loginAs,
}) => {
  const baseline = await getProfile(database)
  let stagedPath: string | null = null

  try {
    await loginAs(actors.owner)
    await page.goto("/")
    await expect(page.getByRole("link", { name: "새 게시글 작성" })).toBeVisible()
    await page.getByRole("button", { name: "Edit Profile" }).click()
    await expect(page.getByRole("link", { name: "새 게시글 작성" })).not.toBeVisible()
    await page.getByLabel("프로필 이미지", { exact: true }).setInputFiles({
      name: "saved-avatar.png",
      mimeType: "image/png",
      buffer: redPng,
    })
    await expect(
      page.getByText("새 이미지가 준비되었습니다. 저장하면 공개 프로필에 반영됩니다."),
    ).toBeVisible()
    const preview = page.getByRole("img", { name: "avatar preview" })
    await expect
      .poll(() =>
        preview.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true)
    const stagedUrl = await preview.getAttribute("src")
    expect(stagedUrl).not.toBeNull()
    stagedPath = avatarPath(stagedUrl!)

    await page.getByRole("button", { name: "저장", exact: true }).click()
    await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible()
    await expect(page.getByRole("link", { name: "새 게시글 작성" })).toBeVisible()
    await expect.poll(async () => (await getProfile(database)).avatar_url).toBe(stagedUrl)
    const publishedAvatar = page.getByRole("img", { name: baseline.name, exact: true })
    await expect
      .poll(() =>
        publishedAvatar.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true)
    expect(await downloadBytes(database, stagedPath)).toEqual(redPng)
  } finally {
    await restoreProfile(database, baseline)
    if (stagedPath) {
      const { error } = await database.storage.from("avatars").remove([stagedPath])
      if (error) throw error
    }
  }
})

test("skill button and keyboard reordering persist after save and reload", async ({
  page,
  database,
  actors,
  loginAs,
}) => {
  const baseline = await getProfile(database)
  const suffix = randomUUID().slice(0, 8)
  const alpha = `Alpha-${suffix}`
  const beta = `Beta-${suffix}`
  const gamma = `Gamma-${suffix}`

  try {
    const { error } = await database
      .from("owner_profile")
      .update({ skills: [alpha, beta, gamma] })
      .eq("id", baseline.id)
    if (error) throw error

    await loginAs(actors.owner)
    await page.goto("/")
    await page.getByRole("button", { name: "Edit Profile" }).click()

    await page.getByRole("button", { name: `${beta} 기술을 앞으로 이동` }).click()
    const gammaHandle = page.getByRole("button", { name: `${gamma} 기술 순서 드래그` })
    await gammaHandle.focus()
    await page.keyboard.press("Space")
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("Escape")
    await expect(gammaHandle).not.toHaveAttribute("aria-pressed", "true")
    expect(
      await page
        .getByRole("button", { name: /기술 순서 드래그/ })
        .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label"))),
    ).toEqual([
      `${beta} 기술 순서 드래그`,
      `${alpha} 기술 순서 드래그`,
      `${gamma} 기술 순서 드래그`,
    ])

    await gammaHandle.focus()
    await page.keyboard.press("Space")
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("Space")

    const expected = [beta, gamma, alpha]
    await page.getByRole("button", { name: "저장", exact: true }).click()
    await expect(page.getByRole("button", { name: "Edit Profile" })).toBeVisible()
    await expect.poll(async () => (await getProfile(database)).skills).toEqual(expected)

    await page.reload()
    const skills = await page.locator(".flex.flex-wrap.gap-2 > span").allTextContents()
    expect(skills.filter((skill) => expected.includes(skill))).toEqual(expected)
  } finally {
    await restoreProfile(database, baseline)
  }
})

test("profile editing remains usable with long labels at 320px", async ({
  page,
  database,
  actors,
  loginAs,
}) => {
  const baseline = await getProfile(database)
  const suffix = randomUUID().slice(0, 8)
  const longSkill = `ExtremelyLongUnbrokenSkillNameForMobileLayout-${suffix}`
  const otherSkill = `Short-${suffix}`

  try {
    const { error } = await database
      .from("owner_profile")
      .update({
        name: `Extremely Long Profile Name That Must Remain Editable ${suffix}`,
        skills: [longSkill, otherSkill],
      })
      .eq("id", baseline.id)
    if (error) throw error

    await page.setViewportSize({ width: 320, height: 720 })
    await loginAs(actors.owner)
    await page.goto("/")
    await page.getByRole("button", { name: "Edit Profile" }).click()
    await expect(page.getByLabel("이름", { exact: true })).toBeVisible()

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth)

    const skillControls = page.getByRole("button", { name: new RegExp(longSkill) })
    expect(await skillControls.count()).toBe(4)
    for (const control of await skillControls.all()) {
      const box = await control.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(320)
    }

    await page.getByRole("button", { name: `${longSkill} 기술을 뒤로 이동` }).click()
    await expect(page.getByText(new RegExp(`${longSkill} 기술을 2개 중 2번째`))).toBeVisible()
    await page.getByRole("button", { name: "취소", exact: true }).click()
  } finally {
    await restoreProfile(database, baseline)
  }
})

test("project button reordering persists atomically after reload", async ({
  page,
  database,
  actors,
  loginAs,
}) => {
  const baseline = await getProjects(database)
  const suffix = randomUUID().slice(0, 8)
  const firstName = `E2E Project A ${suffix}`
  const secondName = `E2E Project B ${suffix}`
  let inserted: ProjectRow[] = []

  try {
    inserted = await insertProjects(database, [firstName, secondName])
    await loginAs(actors.owner)
    await page.goto("/projects")
    const before = await projectNames(page)
    const secondIndex = before.indexOf(secondName)
    expect(secondIndex).toBeGreaterThan(0)
    const expected = [...before]
    ;[expected[secondIndex - 1], expected[secondIndex]] = [
      expected[secondIndex],
      expected[secondIndex - 1],
    ]

    await page.getByRole("button", { name: `${secondName} 프로젝트를 앞으로 이동` }).click()
    await expect(
      page.getByRole("status").filter({ hasText: "프로젝트 순서를 저장했습니다." }),
    ).toHaveText("프로젝트 순서를 저장했습니다.")
    await expect
      .poll(async () => (await getProjects(database)).map(({ name }) => name))
      .toEqual(expected)

    await page.reload()
    await expect.poll(() => projectNames(page)).toEqual(expected)
  } finally {
    await restoreProjects(
      database,
      baseline,
      inserted.map(({ id }) => id),
    )
  }
})

test("incomplete owner, reader, and anonymous RPC calls leave every project order unchanged", async ({
  database,
  actors,
}) => {
  const baseline = await getProjects(database)
  let inserted: ProjectRow[] = []

  try {
    inserted = await insertProjects(database, [`E2E RPC ${randomUUID().slice(0, 8)}`])
    const before = (await getProjects(database)).map(({ id, order }) => ({ id, order }))
    const ids = before.map(({ id }) => id)
    const owner = await createActorClient(actors.owner)
    const reader = await createActorClient(actors.reader)
    const stack = getLocalStack()
    const anonymous = createClient(stack.url, stack.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const incomplete = await owner.rpc("reorder_open_source", { project_ids: ids.slice(1) })
    expect(incomplete.error?.code).toBe("22023")
    expect((await getProjects(database)).map(({ id, order }) => ({ id, order }))).toEqual(before)

    const readerAttempt = await reader.rpc("reorder_open_source", {
      project_ids: [...ids].reverse(),
    })
    expect(readerAttempt.error?.code).toBe("42501")
    expect((await getProjects(database)).map(({ id, order }) => ({ id, order }))).toEqual(before)

    const anonymousAttempt = await anonymous.rpc("reorder_open_source", {
      project_ids: [...ids].reverse(),
    })
    expect(anonymousAttempt.error?.code).toBe("42501")
    expect((await getProjects(database)).map(({ id, order }) => ({ id, order }))).toEqual(before)
  } finally {
    await restoreProjects(
      database,
      baseline,
      inserted.map(({ id }) => id),
    )
  }
})

test("a failed project reorder rolls back in the UI and retry persists the intended order", async ({
  page,
  database,
  actors,
  loginAs,
}) => {
  const baseline = await getProjects(database)
  const suffix = randomUUID().slice(0, 8)
  const firstName = `E2E Retry A ${suffix}`
  const secondName = `E2E Retry B ${suffix}`
  let inserted: ProjectRow[] = []
  let requestCount = 0

  try {
    inserted = await insertProjects(database, [firstName, secondName])
    await loginAs(actors.owner)
    await page.goto("/projects")
    const before = await projectNames(page)
    const secondIndex = before.indexOf(secondName)
    expect(secondIndex).toBeGreaterThan(0)
    const expected = [...before]
    ;[expected[secondIndex - 1], expected[secondIndex]] = [
      expected[secondIndex],
      expected[secondIndex - 1],
    ]

    await page.route("**/rest/v1/rpc/reorder_open_source", async (route) => {
      requestCount += 1
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ code: "XX000", message: "forced E2E network failure" }),
        })
      } else {
        await route.continue()
      }
    })

    await page.getByRole("button", { name: `${secondName} 프로젝트를 앞으로 이동` }).click()
    await expect(page.getByRole("alert")).toHaveText(
      "프로젝트 순서를 저장하지 못해 이전 순서로 복구했습니다.",
    )
    await expect.poll(() => projectNames(page)).toEqual(before)
    expect((await getProjects(database)).map(({ name }) => name)).toEqual(before)

    await page.getByRole("button", { name: "다시 시도", exact: true }).click()
    await expect(
      page.getByRole("status").filter({ hasText: "프로젝트 순서를 저장했습니다." }),
    ).toHaveText("프로젝트 순서를 저장했습니다.")
    expect(requestCount).toBe(2)
    await expect
      .poll(async () => (await getProjects(database)).map(({ name }) => name))
      .toEqual(expected)

    await page.reload()
    await expect.poll(() => projectNames(page)).toEqual(expected)
  } finally {
    await page.unroute("**/rest/v1/rpc/reorder_open_source")
    await restoreProjects(
      database,
      baseline,
      inserted.map(({ id }) => id),
    )
  }
})
