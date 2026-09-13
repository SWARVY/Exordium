import { test, expect } from "./fixtures"

test("card depth follows the article target and search focus stays on its containing control", async ({
  page,
  createPost,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 1100 })
  const post = await createPost({ tags: ["Interaction"], title: "Interaction review" })
  await page.goto("/")
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("link", { name: post.title, exact: true }) })
  const article = card.getByRole("link", { name: post.title, exact: true })
  await card.scrollIntoViewIfNeeded()
  await article.hover()
  await expect
    .poll(() => card.evaluate((el) => getComputedStyle(el).boxShadow))
    .toContain("4px 4px 0px")
  await expect
    .poll(() =>
      card.evaluate((el) => {
        const style = getComputedStyle(el)
        return style.boxShadow.includes(style.borderColor)
      }),
    )
    .toBe(true)
  const box = (await card.boundingBox())!
  await page.screenshot({
    path: testInfo.outputPath("card-hover.png"),
    clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 },
  })
  await card.getByRole("link", { name: /Interaction 태그/ }).hover()
  await expect(card).toHaveCSS("box-shadow", "none")
  await article.focus()
  await expect
    .poll(() => card.evaluate((el) => getComputedStyle(el).boxShadow))
    .toContain("4px 4px 0px")

  const trigger = page.getByRole("button", { name: "검색 열기" })
  await trigger.click()
  const search = page.getByRole("searchbox")
  await expect(search).toBeFocused()
  await expect(search).toHaveCSS("outline-style", "none")
  await expect(search).toHaveCSS("cursor", "text")
  expect(
    await page.evaluate(
      () =>
        getComputedStyle(document.documentElement).backgroundColor ===
        getComputedStyle(document.body).backgroundColor,
    ),
  ).toBe(true)
  await page.getByRole("dialog").screenshot({ path: testInfo.outputPath("search-focus.png") })
  await page.keyboard.press("Tab")
  const close = page.getByRole("dialog").getByRole("button", { name: /닫기/ })
  await expect(close).toBeFocused()
  await expect(close).toHaveCSS("outline-style", "solid")
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
})
