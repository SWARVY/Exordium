import { test, expect } from "./fixtures"

for (const width of [390, 1440]) {
  test(`authentication navigation stays identifiable and logs out at ${width}px`, async ({
    page,
    actors,
    loginAs,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto("/")
    // Base UI tooltips are visual labels; the trigger keeps its accessible name.
    const tooltip = page.locator('[data-slot="tooltip-content"]')
    const login = page.getByRole("button", { name: "Login", exact: true })
    await expect(login).toHaveCount(1)
    await expect(login).toBeEnabled()
    const box = await login.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)

    if (width >= 640) {
      const theme = page.getByRole("button", { name: "테마 변경" })
      const themeBox = await theme.boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(themeBox!.x + themeBox!.width)
      await login.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toHaveText("Login")
      await page.mouse.move(0, 0)
      await tooltip.waitFor({ state: "detached" })
      await theme.focus()
      await page.keyboard.press("Tab")
      await expect(login).toBeFocused()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toHaveText("Login")
      await page.keyboard.press("Escape")
      await expect(tooltip).toBeHidden()
    } else {
      await expect(page.locator("header").getByRole("button", { name: "Login" })).toHaveCount(0)
      await expect(login).toHaveText("Login")
    }
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: testInfo.outputPath("login.png"), animations: "disabled" })

    await loginAs(actors.reader)
    await page.reload()
    const logout = page.getByRole("button", { name: "Logout", exact: true })
    await expect(logout).toHaveCount(1)
    await expect(logout).toBeEnabled()
    if (width >= 640) {
      await logout.hover()
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toHaveText("Logout")
    } else {
      await expect(logout).toHaveText("Logout")
    }
    await page.screenshot({ path: testInfo.outputPath("logout.png"), animations: "disabled" })

    // Hold the real local logout request to observe the duplicate-submission guard.
    let releaseLogout!: () => void
    const release = new Promise<void>((resolve) => {
      releaseLogout = resolve
    })
    await page.route("**/auth/v1/logout*", async (route) => {
      await release
      await route.continue()
    })
    try {
      await logout.click()
      await expect(logout).toBeDisabled()
      await expect(logout).toHaveAttribute("aria-busy", "true")
      await Promise.all([
        page.waitForEvent("framenavigated", { predicate: (frame) => frame === page.mainFrame() }),
        Promise.resolve().then(releaseLogout),
      ])
      await page.waitForLoadState("load")
    } finally {
      releaseLogout()
    }
    await expect(login).toHaveCount(1)
    await expect(login).toBeEnabled()
    await page.reload()
    await expect(login).toBeVisible()
    await expect(logout).toHaveCount(0)
  })
}
