import { test, expect } from "./fixtures"

for (const width of [320, 1440]) {
  test(`reaction controls keep their layout and preserve independent selections at ${width}px`, async ({
    page,
    actors,
    loginAs,
    database,
    createPost,
  }, testInfo) => {
    const post = await createPost()
    let releaseSave!: () => void
    let writes = 0
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve
    })
    await page.route("**/rest/v1/post_reactions*", async (route) => {
      if (route.request().method() === "POST") {
        writes++
        if (writes === 1) await saveGate
      }
      await route.continue()
    })
    await page.setViewportSize({ width, height: 1000 })
    await loginAs(actors.reader)
    await page.goto(`/posts/${post.slug}`)
    const like = page.getByRole("button", { name: "👍", exact: true }).first()
    await expect(like).toBeEnabled()
    await expect(like.getByText("0", { exact: true })).toBeVisible()
    const before = await like.boundingBox()
    expect(before!.width).toBeGreaterThanOrEqual(44)
    expect(before!.height).toBeGreaterThanOrEqual(44)
    const chip = like.locator('[data-slot="reaction-chip"]')
    const idleColor = await chip.evaluate((el) => getComputedStyle(el).backgroundColor)
    await like.focus()
    await page.keyboard.press("Space")
    try {
      await expect(like).toBeDisabled()
      await expect(like).toBeFocused()
      await expect.poll(() => writes).toBe(1)
      await page.keyboard.press("Space")
      expect(writes).toBe(1)
    } finally {
      releaseSave()
    }
    await expect(like).toHaveAttribute("aria-pressed", "true")
    await expect(like.getByText("1", { exact: true })).toBeVisible()
    await expect(like).toBeEnabled()
    expect((await like.boundingBox())!.width).toBe(before!.width)
    expect(await chip.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(idleColor)
    await page.keyboard.press("ArrowRight")
    const heart = page.getByRole("button", { name: "❤️", exact: true }).first()
    await expect(heart).toBeFocused()
    await page.keyboard.press("Space")
    await expect(heart).toHaveAttribute("aria-pressed", "true")
    await expect(heart).toBeEnabled()
    await expect(like).toHaveAttribute("aria-pressed", "true")
    await expect
      .poll(async () => {
        const { data, error } = await database
          .from("post_reactions")
          .select("emoji")
          .eq("post_id", post.id)
          .eq("user_id", actors.reader.id)
        if (error) throw error
        return data.map((row) => row.emoji).sort()
      })
      .toEqual(["👍", "❤️"].sort())
    await page.screenshot({
      path: testInfo.outputPath(`selected-${width}.png`),
      animations: "disabled",
    })
    await page.reload()
    await expect(like).toHaveAttribute("aria-pressed", "true")
    await expect(heart).toHaveAttribute("aria-pressed", "true")
    await like.click()
    await expect(like).toHaveAttribute("aria-pressed", "false")
    await expect(like).toBeEnabled()
    await expect(heart).toHaveAttribute("aria-pressed", "true")

    const comments = page.getByRole("region", { name: "댓글" })
    await comments
      .getByRole("textbox", { name: "댓글", exact: true })
      .fill("리액션 선택을 확인하는 댓글")
    await comments.getByRole("button", { name: "등록", exact: true }).click()
    const comment = comments.getByRole("article").filter({ hasText: "리액션 선택을 확인하는 댓글" })
    const add = comment.getByRole("button", { name: "반응 추가", exact: true })
    await add.click()
    const popup = page.getByRole("dialog", { name: "반응 추가" })
    await expect(popup).toBeVisible()
    await expect.poll(async () => (await popup.boundingBox())!.height).toBeLessThanOrEqual(64)
    expect((await popup.boundingBox())!.width).toBeLessThanOrEqual(288)
    await page.screenshot({
      path: testInfo.outputPath(`picker-${width}.png`),
      animations: "disabled",
    })
    await page.keyboard.press("Escape")
    await expect(popup).toHaveCount(0)
    await expect(add).toBeFocused()
    await add.click()
    await popup.getByRole("button", { name: "🔥", exact: true }).click()
    await expect(popup).toHaveCount(0)
    const fire = comment.getByRole("button", { name: "🔥", exact: true })
    await expect(fire).toHaveAttribute("aria-pressed", "true")
    await expect(fire).toBeEnabled()
    await expect(add).toBeFocused()
    await page.screenshot({
      path: testInfo.outputPath(`comment-${width}.png`),
      animations: "disabled",
    })
    await page.reload()
    await expect(fire).toHaveAttribute("aria-pressed", "true")
    await expect(fire.getByText("1", { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
