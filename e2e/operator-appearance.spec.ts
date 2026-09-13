import { test, expect } from "./fixtures"

test("primary actions use each palette for hover depth and readable labels", async ({
  page,
  actors,
  loginAs,
}, testInfo) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1440, height: 1100 })
  await loginAs(actors.owner)
  await page.goto("/")
  await page.getByRole("button", { name: "Edit Profile" }).click()
  const save = page.getByRole("button", { name: "저장", exact: true })
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
      await save.hover()
      await expect
        .poll(() =>
          save.evaluate((el) => {
            const style = getComputedStyle(el)
            return (
              style.boxShadow.includes(style.borderColor) &&
              style.borderColor ===
                getComputedStyle(document.documentElement).getPropertyValue("--primary-ink").trim()
            )
          }),
        )
        .toBe(true)
      const contrast = await save.evaluate((el) => {
        const canvas = document.createElement("canvas").getContext("2d")!
        const luminance = (color: string) => {
          canvas.clearRect(0, 0, 1, 1)
          canvas.fillStyle = color
          canvas.fillRect(0, 0, 1, 1)
          const [r, g, b] = [...canvas.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
            const channel = value / 255
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          })
          return r * 0.2126 + g * 0.7152 + b * 0.0722
        }
        const style = getComputedStyle(el)
        const a = luminance(style.color),
          b = luminance(style.backgroundColor)
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      })
      expect(contrast, `${name} ${dark ? "dark" : "light"}`).toBeGreaterThanOrEqual(4.5)
      await page.getByRole("heading", { name: "프로필 편집" }).hover()
      await expect(save).toHaveCSS("box-shadow", "none")
      if (name === "Amber" || name === "Blue") {
        await page
          .getByRole("form", { name: "프로필 편집" })
          .screenshot({
            path: testInfo.outputPath(`profile-${name}-${dark ? "dark" : "light"}.png`),
            animations: "disabled",
          })
      }
    }
  }
})

for (const width of [320, 1440]) {
  test(`operator forms keep readable hierarchy and usable controls at ${width}px`, async ({
    page,
    actors,
    loginAs,
    database,
  }, testInfo) => {
    test.setTimeout(60_000)
    const { data: baseline, error } = await database.from("owner_profile").select("*").single()
    if (error) throw error
    try {
      const updated = await database
        .from("owner_profile")
        .update({ skills: ["React", "TypeScript", "Accessibility"] })
        .eq("id", baseline.id)
      if (updated.error) throw updated.error
      await page.setViewportSize({ width, height: width === 1440 ? 1200 : 1000 })
      await loginAs(actors.owner)
      await page.goto("/")
      await page.getByRole("button", { name: "Edit Profile" }).click()
      const form = page.getByRole("form", { name: "프로필 편집" })
      await expect(form).toBeVisible()
      await expect(form.getByLabel("이름", { exact: true })).toHaveCSS(
        "font-size",
        width < 640 ? "16px" : "14px",
      )
      const rows = form.getByRole("list", { name: "Skills" }).getByRole("listitem")
      expect(await rows.count()).toBe(3)
      const boxes = await Promise.all((await rows.all()).map((row) => row.boundingBox()))
      expect(boxes[1]!.y).toBeGreaterThanOrEqual(boxes[0]!.y + boxes[0]!.height)
      await expect(form.getByRole("button", { name: "React 기술 순서 드래그" })).toHaveCSS(
        "cursor",
        "grab",
      )
      await expect(form.getByRole("button", { name: "React 기술을 앞으로 이동" })).toBeDisabled()
      const zone = form.getByRole("button", { name: "프로필 이미지 업로드" })
      await expect(zone).toHaveCSS("cursor", "pointer")
      await zone.focus()
      const chooser = page.waitForEvent("filechooser")
      await zone.press("Enter")
      await (await chooser).setFiles([])
      await form.getByRole("heading", { name: "프로필 편집" }).click()
      await form.screenshot({
        path: testInfo.outputPath(`profile-${width}.png`),
        animations: "disabled",
      })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await form.getByRole("button", { name: "취소", exact: true }).click()

      await page.goto("/projects")
      const add = page.getByRole("button", { name: "추가", exact: true })
      await expect(add).toHaveCSS("cursor", "pointer")
      await expect(add).toHaveCSS("box-shadow", "none")
      await add.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog.getByLabel("이름", { exact: true })).toHaveCSS(
        "font-size",
        width < 640 ? "16px" : "14px",
      )
      const save = dialog.getByRole("button", { name: "저장", exact: true })
      await expect(save).toHaveCSS("box-shadow", "none")
      await save.hover()
      await expect
        .poll(() => save.evaluate((el) => getComputedStyle(el).boxShadow))
        .toContain("3px 3px 0px")
      await expect
        .poll(() =>
          save.evaluate((el) => {
            const style = getComputedStyle(el)
            return style.boxShadow.includes(style.borderColor)
          }),
        )
        .toBe(true)
      await dialog.getByRole("heading").hover()
      await expect(save).toHaveCSS("box-shadow", "none")
      await page.screenshot({
        path: testInfo.outputPath(`project-${width}.png`),
        animations: "disabled",
      })
      await dialog.getByRole("button", { name: "취소", exact: true }).click()
      await expect(add).toBeFocused()

      await page.goto("/posts/new")
      await expect(page.locator("[contenteditable=true]")).toBeVisible()
      await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "24px")
      await expect(page.locator(".jikjo-placeholder")).toHaveCSS("font-size", "14px")
      await page.getByRole("button", { name: "부가 설정", exact: true }).click()
      const actions = page.getByRole("toolbar", { name: "게시글 편집 작업" })
      for (const button of await actions.getByRole("button").all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
        await expect(button).toHaveCSS("box-shadow", "none")
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await page.screenshot({
        path: testInfo.outputPath(`editor-${width}.png`),
        animations: "disabled",
      })
    } finally {
      const { id, ...values } = baseline
      const restored = await database.from("owner_profile").update(values).eq("id", id)
      if (restored.error) throw restored.error
    }
  })
}
