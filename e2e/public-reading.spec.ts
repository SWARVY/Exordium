import { randomUUID } from "node:crypto"

import { test, expect } from "./fixtures"

test("punctuation remains search text and keyboard dismissal returns focus", async ({
  page,
  createPost,
}) => {
  const phrase = `Research, (notes) "quoted" ${randomUUID()}`
  const post = await createPost({ title: phrase })
  await page.goto("/")
  const trigger = page.getByRole("button", { name: "검색 열기" })
  await trigger.click()
  const search = page.getByRole("searchbox")
  await expect(search).toBeFocused()
  await search.fill(phrase)
  const result = page.getByRole("dialog").getByRole("link", { name: phrase })
  await expect(result).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
  await trigger.click()
  await search.fill(phrase)
  await page.getByRole("dialog").getByRole("link", { name: phrase }).click()
  await expect(page).toHaveURL(new RegExp(`/posts/${post.slug}$`))
  await expect(page.getByText("Original preserved body", { exact: true })).toBeVisible()
})

test("published content and metadata exist without JavaScript, missing articles return 404", async ({
  browser,
  request,
  createPost,
}) => {
  const post = await createPost()
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4317",
    javaScriptEnabled: false,
  })
  try {
    const page = await context.newPage()
    await page.goto(`/posts/${post.slug}`)
    await expect(page.getByRole("heading", { level: 1, name: post.title })).toBeVisible()
    await expect(page.getByText("Original preserved body", { exact: true })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `http://127.0.0.1:4317/posts/${post.slug}`,
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/og-default.png$/,
    )
    const missing = await page.goto(`/posts/absent-${randomUUID()}`)
    expect(missing?.status()).toBe(404)
  } finally {
    await context.close()
  }
  const sitemap = await request.get("/sitemap.xml")
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).toContain(`<loc>http://127.0.0.1:4317/posts/${post.slug}</loc>`)
  const robots = await request.get("/robots.txt")
  expect(await robots.text()).toContain("Sitemap: http://127.0.0.1:4317/sitemap.xml")
})
