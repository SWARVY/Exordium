import { test, expect } from "./fixtures"

test("tag links filter by exact membership and preserve refresh and back navigation", async ({
  page,
  createPost,
}) => {
  const tag = "주제 C++ / UI & UX"
  const first = await createPost({ title: "관련 글 하나", tags: [tag] })
  const second = await createPost({ title: "관련 글 둘", tags: [tag] })
  const unrelated = await createPost({ title: `${tag}가 제목에만 있는 글`, tags: [`${tag}-extra`] })
  await page.goto("/")
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("link", { name: first.title, exact: true }) })
  const link = card.getByRole("link", { name: `${tag} 태그 글 보기`, exact: true })
  await link.focus()
  await page.keyboard.press("Enter")
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe(tag)
  await expect(page.getByRole("region", { name: "태그 필터" })).toContainText(tag)
  await expect(page.getByRole("article")).toHaveCount(2)
  await expect(page.getByRole("link", { name: unrelated.title, exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole("link", { name: second.title, exact: true })).toBeVisible()
  await page.getByRole("link", { name: first.title, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/posts/${first.slug}$`))
  await page.goBack()
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe(tag)
  await expect(page.getByRole("article")).toHaveCount(2)
  await page.getByRole("link", { name: "필터 해제", exact: true }).click()
  await expect(page).toHaveURL(/\/posts\/?$/)
  await expect(page.getByRole("link", { name: unrelated.title, exact: true })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole("article")).toHaveCount(2)
})

test("mobile overflow tags navigate from the popover and empty filters can be cleared", async ({
  page,
  createPost,
}) => {
  await page.setViewportSize({ width: 390, height: 900 })
  const tag = "Popover destination"
  const source = await createPost({
    title: "팝오버 탐색 출발",
    tags: ["Responsive", "Accessibility", "Typography", tag],
  })
  const related = await createPost({ title: "팝오버 탐색 도착", tags: [tag] })
  await page.goto(`/posts/${source.slug}`)
  await page.getByRole("button", { name: "태그 4개 모두 보기" }).click()
  const popup = page.getByRole("dialog", { name: "태그" })
  const link = popup.getByRole("link", { name: `${tag} 태그 글 보기`, exact: true })
  // 공용 팝오버의 진입 애니메이션이 끝난 실제 조작 크기를 확인한다.
  await expect.poll(async () => (await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
  await link.click()
  await expect(popup).toHaveCount(0)
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe(tag)
  await expect(page.getByRole("link", { name: related.title, exact: true })).toBeVisible()
  await page.goto("/posts?tag=unknown-empty-topic")
  await expect(page.getByRole("status")).toContainText("이 태그의 글이 없어요.")
  await page.getByRole("link", { name: "필터 해제", exact: true }).click()
  await expect(page.getByRole("link", { name: source.title, exact: true })).toBeVisible()
})

test("loading another page retains the selected tag", async ({ page, createPost }) => {
  const tag = "Pagination topic"
  for (let i = 0; i < 11; i++) {
    await createPost({
      title: `주제 글 ${i}`,
      tags: [tag],
      published_at: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
    })
  }
  await createPost({ title: "필터 밖의 최신 글", tags: [] })
  await page.goto(`/posts?tag=${encodeURIComponent(tag)}`)
  await expect(page.getByRole("article")).toHaveCount(10)
  await page.getByRole("button", { name: "더 보기" }).click()
  await expect(page.getByRole("article")).toHaveCount(11)
  await expect(page.getByRole("link", { name: "필터 밖의 최신 글", exact: true })).toHaveCount(0)
})
