import { expect, type Page } from "@playwright/test"

export async function openPostAdditionalSettings(page: Page) {
  const disclosure = page.getByRole("button", { name: "부가 설정", exact: true })
  if ((await disclosure.getAttribute("aria-expanded")) !== "true") await disclosure.click()
  await expect(disclosure).toHaveAttribute("aria-expanded", "true")
}

export async function fillPostMetadata(
  page: Page,
  values: { title: string; slug: string; description: string; coverImage?: string; tags?: string },
) {
  await page.getByLabel("제목").fill(values.title)
  await openPostAdditionalSettings(page)
  await page.getByLabel("슬러그").fill(values.slug)
  await page.getByLabel("요약").fill(values.description)
  if (values.coverImage) await page.getByLabel("커버 이미지 URL").fill(values.coverImage)
  if (values.tags) await page.getByLabel("태그").fill(values.tags)
}
