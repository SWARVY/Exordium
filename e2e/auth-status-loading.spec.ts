import { test, expect } from "@playwright/test"

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`initial sign-in status respects ${reducedMotion} motion`, async ({ browser, baseURL }) => {
    // Freeze the server-rendered pending view without starting a real OAuth exchange.
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      reducedMotion,
      viewport: { width: 390, height: 844 },
    })
    try {
      const page = await context.newPage()
      await page.goto("/auth/callback")
      const panel = page.getByRole("region", { name: "로그인 확인 중" })
      await expect(panel.getByRole("status")).toContainText("완료되면 홈으로 이동해요")
      await expect(panel.getByRole("alert")).toHaveCount(0)
      await expect(page.getByRole("contentinfo")).toHaveCount(0)
      const animation = await panel
        .locator("svg")
        .evaluate((icon) => getComputedStyle(icon).animationName)
      expect(animation).toBe(reducedMotion === "reduce" ? "none" : "spin")
    } finally {
      await context.close()
    }
  })
}
