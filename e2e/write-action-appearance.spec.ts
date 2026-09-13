import { test, expect } from "./fixtures"

for (const width of [320, 1440]) {
  test(`write action stays distinct over the footer at ${width}px`, async ({
    page,
    actors,
    loginAs,
  }, testInfo) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 900 })
    await loginAs(actors.owner)
    await page.goto("/projects")
    const write = page.getByRole("link", { name: "새 게시글 작성", exact: true })
    await expect(write).toBeVisible()
    const theme = page.getByRole("button", { name: "테마 변경", exact: true })
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
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
        await page.mouse.move(5, 5)
        await expect(write).toHaveCSS("box-shadow", "none")
        const background = await write.evaluate((el) => ({
          button: getComputedStyle(el).backgroundColor,
          footer: getComputedStyle(document.querySelector("footer")!).backgroundColor,
        }))
        expect(background.button, `${name} ${dark ? "dark" : "light"} surface`).not.toBe(
          background.footer,
        )
        await write.hover()
        await expect(write).not.toHaveCSS("box-shadow", "none")
        await expect
          .poll(() => write.evaluate((el) => getComputedStyle(el).translate))
          .toBe("-1px -1px")
        const hit = await write.evaluate((el) => {
          const box = el.getBoundingClientRect()
          return el.contains(
            document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
          )
        })
        expect(hit).toBe(true)
        if (name === "Neutral" || name === "Blue") {
          await page.screenshot({
            path: testInfo.outputPath(`write-${width}-${name}-${dark ? "dark" : "light"}.png`),
          })
        }
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect(write).toHaveCSS("translate", "none")
    await expect(write).not.toHaveCSS("box-shadow", "none")
    await write.click()
    await expect(page).toHaveURL("/posts/new")
    await expect(write).toHaveCount(0)
    await expect(page.getByRole("textbox", { name: "제목", exact: true })).toBeVisible()
  })
}
