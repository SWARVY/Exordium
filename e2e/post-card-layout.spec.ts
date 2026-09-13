import { test, expect } from "./fixtures"

const longTitle =
  "긴 제목에서도 카드의 높이와 읽는 순서가 일정하게 유지되는지 확인하는 기록 ".repeat(4)
const longDescription = "요약이 길어져도 날짜와 다음 카드가 밀리지 않아야 합니다. ".repeat(8)
const tags = [
  "Responsive",
  "Accessibility",
  "Typography",
  "Mobile",
  "React",
  "Testing",
  "Design",
  "태그가아주길어도전체내용을확인할수있어야합니다".repeat(3),
]

test("tag popover respects reduced motion without changing its content or keyboard dismissal", async ({
  page,
  createPost,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const post = await createPost({ tags })
  await page.goto(`/posts/${post.slug}`)
  await expect(page.getByRole("button", { name: "검색 열기" })).toBeEnabled()
  const trigger = page.getByRole("button", { name: "태그 8개 모두 보기" })
  await trigger.click()
  const popup = page.getByRole("dialog", { name: "태그" })
  await expect(popup).toBeVisible()
  expect(await popup.evaluate((el) => getComputedStyle(el).animationName)).toBe("none")
  for (const tag of tags) await expect(popup.getByText(tag, { exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(popup).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

// 실제 브라우저의 줄바꿈·측정·팝오버 포커스를 함께 검증한다. 데이터는 로컬 fixture만 생성/정리한다.
for (const width of [320, 390, 640, 1440]) {
  test(`post cards keep equal height and reveal overflow tags at ${width}px`, async ({
    page,
    createPost,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    const short = await createPost({ title: "짧은 테스트 기록", description: "", tags: [] })
    const long = await createPost({ title: longTitle, description: longDescription, tags })
    await page.goto("/posts")
    await expect(page.getByRole("button", { name: "검색 열기" })).toBeEnabled()
    const shortCard = page
      .getByRole("article")
      .filter({ has: page.getByRole("link", { name: short.title, exact: true }) })
    const longCard = page
      .getByRole("article")
      .filter({ has: page.getByRole("link", { name: long.title, exact: true }) })
    const before = await longCard.boundingBox()
    const grid = longCard.locator("..").locator("..")
    const columns = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    )
    expect(columns).toBe(width >= 640 ? 2 : 1)
    expect(Math.abs(before!.height - (await shortCard.boundingBox())!.height)).toBeLessThanOrEqual(
      1,
    )
    const title = longCard.getByRole("heading")
    const titleMetrics = await title.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      line: parseFloat(getComputedStyle(el).lineHeight),
      scroll: el.scrollHeight,
    }))
    expect(titleMetrics.height).toBeLessThanOrEqual(titleMetrics.line * 2 + 1)
    expect(titleMetrics.scroll).toBeGreaterThan(titleMetrics.height)
    const description = longCard.locator("p")
    expect(await description.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
    const relativeDateTop = async (card: typeof shortCard) =>
      card.evaluate(
        (el) =>
          el.querySelector("time")!.getBoundingClientRect().top - el.getBoundingClientRect().top,
      )
    expect(
      Math.abs((await relativeDateTop(shortCard)) - (await relativeDateTop(longCard))),
    ).toBeLessThanOrEqual(1)
    const trigger = longCard.getByRole("button", { name: "태그 8개 모두 보기" })
    await expect(trigger).toBeVisible()
    const triggerBox = await trigger.boundingBox()
    expect(triggerBox!.width).toBeGreaterThanOrEqual(44)
    expect(triggerBox!.height).toBeGreaterThanOrEqual(44)
    await trigger.focus()
    await page.keyboard.press("Enter")
    const popup = page.getByRole("dialog", { name: "태그" })
    await expect(popup).toBeVisible()
    for (const tag of tags) await expect(popup.getByText(tag, { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/posts\/?$/)
    expect((await longCard.boundingBox())!.height).toBe(before!.height)
    const popupBox = await popup.boundingBox()
    expect(popupBox!.x).toBeGreaterThanOrEqual(0)
    expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`tags-${width}.png`),
      animations: "disabled",
    })
    await page.keyboard.press("Escape")
    await expect(popup).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.getByRole("heading", { level: 1 }).click()
    await expect(popup).toHaveCount(0)
    await page.screenshot({
      path: testInfo.outputPath(`cards-${width}.png`),
      animations: "disabled",
    })
    await longCard.click({ position: { x: 24, y: before!.height - 24 } })
    await expect(page).toHaveURL(new RegExp(`/posts/${long.slug}$`))
    await expect(page.getByRole("heading", { level: 1, name: long.title })).toBeVisible()
    await page.getByRole("button", { name: "태그 8개 모두 보기" }).click()
    await expect(
      page.getByRole("dialog", { name: "태그" }).getByText(tags[7], { exact: true }),
    ).toBeVisible()
  })
}

test("a single oversized tag remains available and cards adapt to larger text and resizing", async ({
  page,
  createPost,
}) => {
  const tag = "매우긴태그이름".repeat(30)
  const post = await createPost({ title: longTitle, tags: [tag] })
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto("/posts")
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("link", { name: post.title, exact: true }) })
  const trigger = card.getByRole("button", { name: "태그 1개 모두 보기" })
  await trigger.click()
  await expect(
    page.getByRole("dialog", { name: "태그" }).getByText(tag, { exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  const initialHeight = (await card.boundingBox())!.height
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" })
  await expect.poll(async () => (await card.boundingBox())!.height).toBe(initialHeight * 2)
  for (const width of [640, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await trigger.click()
    const popup = page.getByRole("dialog", { name: "태그" })
    await expect(popup).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await popup.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.keyboard.press("Escape")
  }
})

test("tag previews use available width and restore overflow controls after resizing", async ({
  page,
  createPost,
}) => {
  const post = await createPost({
    title: "태그 공간 테스트",
    tags: ["React", "Frontend", "Accessibility"],
  })
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto("/posts")
  const card = page.getByRole("article").filter({
    has: page.getByRole("link", { name: post.title, exact: true }),
  })
  const trigger = card.getByRole("button", { name: "태그 3개 모두 보기" })
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(page.getByRole("dialog", { name: "태그" })).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(trigger).toHaveCount(0)
  await expect(page.getByRole("dialog", { name: "태그" })).toHaveCount(0)
  await expect(
    card.getByText("Accessibility", { exact: true }).filter({ visible: true }),
  ).toBeVisible()
  await page.setViewportSize({ width: 320, height: 900 })
  await expect(trigger).toBeVisible()
  await expect(page.getByRole("dialog", { name: "태그" })).toHaveCount(0)
  await trigger.click()
  const popup = page.getByRole("dialog", { name: "태그" })
  await expect(popup.getByText("Accessibility", { exact: true })).toBeVisible()
  await popup.getByRole("button", { name: "닫기", exact: true }).click()
  await expect(popup).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test("cards group short content at the top regardless of tags", async ({ page, createPost }) => {
  await page.setViewportSize({ width: 900, height: 1000 })
  const plain = await createPost({
    title: "태그 없는 짧은 기록",
    description: "짧은 요약",
    tags: [],
  })
  const tagged = await createPost({
    title: "태그가 있는 기록",
    description: "같은 길이의 요약",
    tags: ["Layout"],
  })
  await page.goto("/posts")
  for (const post of [plain, tagged]) {
    const card = page
      .getByRole("article")
      .filter({ has: page.getByRole("link", { name: post.title, exact: true }) })
    const metrics = await card.evaluate((el) => {
      const title = el.querySelector("h2")!.getBoundingClientRect()
      const summary = el.querySelector("p")!.getBoundingClientRect()
      return {
        inset: title.top - el.getBoundingClientRect().top,
        gap: summary.top - title.bottom,
        titleHeight: title.height,
        lineHeight: parseFloat(getComputedStyle(el.querySelector("h2")!).lineHeight),
      }
    })
    // 제목은 공통 카드 패딩에서 시작하고, 짧은 제목과 요약 사이에 빈 행을 남기지 않는다.
    expect(metrics.inset).toBeLessThanOrEqual(24)
    expect(metrics.gap).toBeGreaterThanOrEqual(4)
    expect(metrics.gap).toBeLessThanOrEqual(12)
    expect(metrics.titleHeight).toBeLessThanOrEqual(metrics.lineHeight + 1)
  }
})
