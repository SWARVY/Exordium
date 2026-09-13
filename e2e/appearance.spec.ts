import { test, expect } from "./fixtures"

for (const width of [320, 390, 1440]) {
  test(`reading and search fit a ${width}px viewport with reduced motion`, async ({
    page,
    createPost,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    const post = await createPost({
      title: "모바일에서도 읽을 수 있는 긴 제목과 예외상태 점검",
      description: "긴 주소 " + "a".repeat(120),
    })
    await page.goto(`/posts/${post.slug}`)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const trigger = page.getByRole("button", { name: "검색 열기" })
    const box = await trigger.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    await expect(trigger).toBeEnabled()
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("searchbox")).toBeFocused()
    expect(
      parseFloat(await page.getByRole("searchbox").evaluate((el) => getComputedStyle(el).fontSize)),
    ).toBe(width < 640 ? 16 : 14)
    await page.keyboard.press("Escape")
    await expect(trigger).toBeFocused()
  })
}

test("all six palettes retain legible emphasis in both modes and persist with language", async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto("/posts")
  const theme = page.getByRole("button", { name: "테마 변경" })
  for (const dark of [false, true]) {
    if (dark) {
      await theme.click()
      await page.getByRole("menuitem", { name: "Dark Mode" }).click()
    }
    for (const name of ["Neutral", "Rose", "Violet", "Teal", "Blue", "Amber"]) {
      await theme.click()
      await page.getByRole("menuitemradio", { name, exact: true }).click()
      await page.keyboard.press("Escape")
      await page.reload()
      await theme.click()
      await expect(page.getByRole("menuitemradio", { name, exact: true })).toHaveAttribute(
        "aria-checked",
        "true",
      )
      await page.keyboard.press("Escape")
      const contrast = await page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: "Posts", exact: true })
        .evaluate((element) => {
          const context = document.createElement("canvas").getContext("2d")!
          const luminance = (color: string) => {
            context.clearRect(0, 0, 1, 1)
            context.fillStyle = color
            context.fillRect(0, 0, 1, 1)
            const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
              const s = value / 255
              return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
            })
            return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
          }
          const foreground = luminance(getComputedStyle(element).color)
          const background = luminance(getComputedStyle(document.body).backgroundColor)
          return (
            (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
          )
        })
      expect(
        contrast,
        `${name} ${dark ? "dark" : "light"} emphasis contrast`,
      ).toBeGreaterThanOrEqual(4.5)
      expect(await page.locator("html").evaluate((el) => el.classList.contains("dark"))).toBe(dark)
    }
  }
  await theme.click()
  await page.getByRole("menuitemradio", { name: "English", exact: true }).click()
  await page.keyboard.press("Escape")
  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await page.getByRole("button", { name: "Change theme" }).click()
  await page.getByRole("menuitemradio", { name: "日本語", exact: true }).click()
  await page.keyboard.press("Escape")
  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("lang", "ja")
})
