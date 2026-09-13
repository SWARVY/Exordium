import { test, expect } from "./fixtures"

import type { Locator } from "@playwright/test"

async function clickVisibleHeaderControl(control: Locator) {
  const box = (await control.boundingBox())!
  expect(box.y).toBeGreaterThanOrEqual(0)
  // Locator.click scrolls sticky controls into view, changing the history position under test.
  await control.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

declare global {
  interface Window {
    transitionSamples: { duration: number; y: number; opacity: number }[]
    transitionCalls: number
  }
}

async function observeTransitions(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.transitionSamples = []
    window.transitionCalls = 0
    const start = document.startViewTransition.bind(document)
    document.startViewTransition = (...args) => {
      window.transitionCalls++
      const transition = start(...args)
      void transition.ready
        .then(() => {
          function sample() {
            const animation = document
              .getAnimations()
              .find((a) => a instanceof CSSAnimation && a.animationName === "page-place")
            if (!animation) return
            const style = getComputedStyle(
              document.documentElement,
              "::view-transition-new(page-content)",
            )
            window.transitionSamples.push({
              duration: Number(animation.effect!.getTiming().duration),
              y: style.transform === "none" ? 0 : new DOMMatrixReadOnly(style.transform).m42,
              opacity: Number(style.opacity),
            })
            if (animation.playState === "running") requestAnimationFrame(sample)
          }
          sample()
        })
        .catch(() => {})
      return transition
    }
  })
}

test("reading navigation places content, restores history, and leaves modal scrolling native", async ({
  page,
  createPost,
}, testInfo) => {
  await observeTransitions(page)
  const post = await createPost()
  await page.setViewportSize({ width: 1440, height: 600 })
  await page.goto("/posts")
  await expect(page.getByRole("button", { name: "검색 열기" })).toBeEnabled()
  await page.getByRole("link", { name: post.title, exact: true }).click()
  await expect(page).toHaveURL(`/posts/${post.slug}`)
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.transitionSamples.some((f) => f.y > 0 && f.y < 8 && f.opacity > 0.8),
      ),
    )
    .toBe(true)
  const frames = await page.evaluate(() => window.transitionSamples)
  expect(frames.every((f) => f.duration === 240)).toBe(true)
  expect(frames.some((f) => f.y > 0 && f.y < 8 && f.opacity > 0.8)).toBe(true)
  await page.waitForFunction(
    () =>
      !document
        .getAnimations()
        .some(
          (a) =>
            a instanceof CSSAnimation &&
            a.animationName === "page-place" &&
            a.playState === "running",
        ),
  )
  await page.mouse.move(700, 400)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(50)
  const movingY = await page.evaluate(() => scrollY)
  expect(movingY).toBeGreaterThan(0)
  expect(movingY).toBeLessThan(300)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(300)
  await page.waitForTimeout(100)

  await clickVisibleHeaderControl(page.getByRole("button", { name: "검색 열기" }))
  const search = page.getByRole("dialog", { name: "검색", exact: true })
  await expect(search).toBeVisible()
  const lockedY = await page.evaluate(() => scrollY)
  expect(lockedY).toBe(300)
  await page.mouse.move(20, 400)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => scrollY)).toBe(lockedY)
  await page.keyboard.press("Escape")
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(300)
  await clickVisibleHeaderControl(
    page
      .getByRole("navigation", { name: "주요 메뉴" })
      .getByRole("link", { name: "Projects", exact: true }),
  )
  await expect(page).toHaveURL("/projects")
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await page.goBack()
  await expect(page).toHaveURL(`/posts/${post.slug}`)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(300)
  await page.waitForTimeout(350)
  expect(await page.evaluate(() => scrollY)).toBe(300)
  await page.screenshot({ path: testInfo.outputPath("reading-after-back.png") })
})

test("reduced motion and unsupported view transitions keep navigation usable", async ({
  page,
  createPost,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await observeTransitions(page)
  const post = await createPost()
  await page.setViewportSize({ width: 1440, height: 600 })
  await page.goto("/posts")
  await expect(page.getByRole("button", { name: "검색 열기" })).toBeEnabled()
  await page.getByRole("link", { name: post.title, exact: true }).click()
  await expect(page.getByRole("heading", { name: post.title, exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.transitionCalls)).toBe(0)
  await page.mouse.move(700, 400)
  await page.mouse.wheel(0, 200)
  await page.waitForTimeout(50)
  expect(await page.evaluate(() => scrollY)).toBe(200)
  await page.evaluate(() =>
    Object.defineProperty(document, "startViewTransition", { value: undefined }),
  )
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page
    .getByRole("navigation", { name: "주요 메뉴" })
    .getByRole("link", { name: "Projects", exact: true })
    .click()
  await expect(page).toHaveURL("/projects")
  await page
    .getByRole("navigation", { name: "주요 메뉴" })
    .getByRole("link", { name: "Posts", exact: true })
    .click()
  await expect(page).toHaveURL("/posts")
  await expect(page.getByRole("heading", { name: "All Posts", exact: true })).toBeVisible()
})
