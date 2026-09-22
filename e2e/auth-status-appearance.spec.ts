import { test, expect } from "@playwright/test"

const translations = [
  { locale: "ko", title: "로그인하지 못했어요", retry: "다시 로그인", home: "홈으로 돌아가기" },
  { locale: "en", title: "Unable to sign in", retry: "Try signing in again", home: "Back to Home" },
  {
    locale: "ja",
    title: "ログインできませんでした",
    retry: "もう一度ログイン",
    home: "ホームに戻る",
  },
]

for (const { locale, title, retry, home } of translations) {
  test(`auth recovery remains localized and usable with enlarged ${locale} text`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" })
    await page.addInitScript((value) => localStorage.setItem("locale", value), locale)
    await page.goto("/auth/callback?error=access_denied")
    const panel = page.getByRole("region", { name: title })
    await expect(panel.getByRole("heading", { name: title })).toBeVisible()
    await expect(panel.getByRole("button", { name: retry, exact: true })).toBeEnabled()
    await expect(panel.getByRole("link", { name: home, exact: true })).toBeVisible()
    await expect(page.getByRole("contentinfo")).toHaveCount(0)
    await expect(page.locator("main ~ nav")).toHaveCount(0)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px"
    })
    const bounds = await panel.boundingBox()
    expect(bounds).not.toBeNull()
    const controls = panel.locator("button, a")
    await expect(controls).toHaveCount(2)
    for (const control of await controls.all()) {
      const box = await control.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(bounds!.x)
      expect(box!.x + box!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  })
}
