import { test, expect } from "./fixtures"

for (const width of [320, 1440]) {
  test(`reaction rows stay compact without shrinking touch targets at ${width}px`, async ({
    page,
    actors,
    loginAs,
    createPost,
  }, testInfo) => {
    const post = await createPost()
    await page.setViewportSize({ width, height: 900 })
    await loginAs(actors.reader)
    await page.goto(`/posts/${post.slug}`)
    const reactions = page.getByRole("region", { name: "Reactions", exact: true })
    const like = reactions.getByRole("button", { name: "👍", exact: true })
    await expect(like).toBeEnabled()
    await reactions.scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath(`reactions-${width}.png`) })

    // The visible chip is smaller, but the entire 44px control remains clickable.
    const buttons = await reactions.getByRole("button").all()
    expect(buttons).toHaveLength(5)
    for (const button of buttons) {
      const box = (await button.boundingBox())!
      expect(box.height).toBe(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
      const chip = button.locator('[data-slot="reaction-chip"]')
      expect((await chip.boundingBox())!.height).toBe(28)
    }
    const row = reactions.getByRole("group")
    const rowBox = (await row.boundingBox())!
    const regionBox = (await reactions.boundingBox())!
    expect(Math.abs(rowBox.x + rowBox.width / 2 - regionBox.x - regionBox.width / 2)).toBeLessThan(
      1,
    )
    expect((await row.boundingBox())!.height).toBe(44)
    expect((await row.boundingBox())!.width).toBeLessThanOrEqual(272)
    const headingSize = await reactions
      .getByRole("heading")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(headingSize).toBeLessThanOrEqual(14)

    await like.click({ position: { x: 4, y: 2 } })
    await expect(like).toHaveAttribute("aria-pressed", "true")
    await expect(like).toBeEnabled()
    await page.screenshot({ path: testInfo.outputPath(`selected-${width}.png`) })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test("selected reactions follow every palette and keep readable counts", async ({
  page,
  actors,
  loginAs,
  createPost,
}, testInfo) => {
  test.setTimeout(90_000)
  const post = await createPost()
  await loginAs(actors.reader)
  await page.goto(`/posts/${post.slug}`)
  const reactions = page.getByRole("region", { name: "Reactions", exact: true })
  const like = reactions.getByRole("button", { name: "👍", exact: true })
  await expect(like).toBeEnabled()
  await like.click()
  await expect(like).toHaveAttribute("aria-pressed", "true")
  await expect(like).toBeEnabled()
  const theme = page.getByRole("button", { name: "테마 변경" })

  for (const dark of [false, true]) {
    if (dark) {
      await theme.click()
      await page.getByRole("menuitem", { name: "Dark Mode", exact: true }).click()
      await page.keyboard.press("Escape")
    }
    for (const name of ["Neutral", "Rose", "Violet", "Teal", "Blue", "Amber"]) {
      await theme.click()
      await page.getByRole("menuitemradio", { name, exact: true }).click()
      await page.keyboard.press("Escape")
      await reactions.scrollIntoViewIfNeeded()
      await like.hover()
      const colors = await reactions.evaluate((region) => {
        const ctx = document.createElement("canvas").getContext("2d")!
        const rgb = (color: string) => {
          ctx.clearRect(0, 0, 1, 1)
          ctx.fillStyle = color
          ctx.fillRect(0, 0, 1, 1)
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3)
        }
        const luminance = (color: string) => {
          const channels = rgb(color).map((value) => {
            const n = value / 255
            return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
          })
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        }
        const selected = region.querySelector('[aria-pressed="true"] [data-slot="reaction-chip"]')!
        const selectedStyle = getComputedStyle(selected)
        const root = getComputedStyle(document.documentElement)
        return {
          selectedBorder: rgb(selectedStyle.borderColor),
          themeInk: rgb(root.getPropertyValue("--primary-ink")),
          fill: rgb(selectedStyle.backgroundColor),
          primary: rgb(root.getPropertyValue("--primary")),
          contrasts: [...region.querySelectorAll('[data-slot="reaction-chip"]')].map((chip) => {
            const style = getComputedStyle(chip)
            const a = luminance(style.color),
              b = luminance(style.backgroundColor)
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
          }),
        }
      })
      expect(colors.selectedBorder, `${name} selected outline`).toEqual(colors.themeInk)
      expect(colors.fill, `${name} no solid primary tile`).not.toEqual(colors.primary)
      for (const ratio of colors.contrasts) {
        expect(ratio, `${name} ${dark ? "dark" : "light"} count contrast`).toBeGreaterThanOrEqual(
          4.5,
        )
      }
      if (name === "Amber") {
        await page.screenshot({ path: testInfo.outputPath(`amber-${dark ? "dark" : "light"}.png`) })
      }
    }
  }

  await page.setViewportSize({ width: 640, height: 1000 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%"
  })
  await expect(reactions.getByRole("button")).toHaveCount(5)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await reactions.scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath("large-text.png") })
})
