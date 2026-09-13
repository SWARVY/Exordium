import { test, expect } from "./fixtures"
import { openPostAdditionalSettings } from "./helpers/post-editor"

// These fill colors are the existing palette contract, independent of new text corrections.
const palettes = [
  ["Neutral", "oklch(0.205 0 0)", "oklch(0.922 0 0)"],
  ["Rose", "oklch(0.645 0.246 16.439)", "oklch(0.704 0.191 22.216)"],
  ["Violet", "oklch(0.606 0.25 292.717)", "oklch(0.702 0.183 292.717)"],
  ["Teal", "oklch(0.6 0.118 184.704)", "oklch(0.696 0.17 162.48)"],
  ["Blue", "oklch(0.45 0.22 255)", "oklch(0.65 0.2 255)"],
  ["Amber", "oklch(0.769 0.188 70.08)", "oklch(0.828 0.189 84.429)"],
]

test("palette fills stay unchanged while text on colored surfaces remains readable", async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto("/")
  const theme = page.getByRole("button", { name: "테마 변경" })
  for (const dark of [false, true]) {
    if (dark) {
      await theme.click()
      await page.getByRole("menuitem", { name: "Dark Mode", exact: true }).click()
      await page.keyboard.press("Escape")
      await page.locator('[role="menu"]').waitFor({ state: "detached" })
    }
    for (const [name, light, night] of palettes) {
      await theme.click()
      await page.getByRole("menuitemradio", { name, exact: true }).click()
      await page.keyboard.press("Escape")
      await page.locator('[role="menu"]').waitFor({ state: "detached" })
      const values = await page.locator("footer").evaluate((footer) => {
        const canvas = document.createElement("canvas").getContext("2d")!
        const luminance = (color: string) => {
          canvas.clearRect(0, 0, 1, 1)
          canvas.fillStyle = color
          canvas.fillRect(0, 0, 1, 1)
          const rgb = [...canvas.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
            const channel = value / 255
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          })
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
        }
        const contrast = (a: string, b: string) => {
          const x = luminance(a)
          const y = luminance(b)
          return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
        }
        const style = getComputedStyle(footer)
        const heading = document.querySelector("h1 span")!
        return {
          fill: style.backgroundColor,
          inkContrast: contrast(
            getComputedStyle(document.documentElement).getPropertyValue("--primary-ink"),
            getComputedStyle(document.body).backgroundColor,
          ),
          contrast: contrast(style.color, style.backgroundColor),
          headingContrast: contrast(
            getComputedStyle(heading).color,
            getComputedStyle(document.body).backgroundColor,
          ),
        }
      })
      expect(values.fill, `${name} fill`).toBe(dark ? night : light)
      expect
        .soft(values.contrast, `${name} ${dark ? "dark" : "light"} text on fill`)
        .toBeGreaterThanOrEqual(4.5)
      expect.soft(values.inkContrast, `${name} small accent text`).toBeGreaterThanOrEqual(4.5)
      expect.soft(values.headingContrast, `${name} display text`).toBeGreaterThanOrEqual(3)
    }
  }
})

test("Blue display lettering uses the same established accent as the avatar", async ({ page }) => {
  await page.goto("/")
  const colors = await page.getByRole("heading", { level: 1 }).evaluate((heading) => {
    const context = document.createElement("canvas").getContext("2d")!
    const rgb = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data]
    }
    return {
      lettering: rgb(getComputedStyle(heading.querySelector("span")!).color),
      accent: rgb(getComputedStyle(document.documentElement).getPropertyValue("--primary")),
    }
  })
  expect(colors.lettering).toEqual(colors.accent)
})

test("dark editor metadata fields share a surface instead of using the input border as a fill", async ({
  page,
  loginAs,
  actors,
}) => {
  await loginAs(actors.owner)
  await page.goto("/posts/new")
  await page.getByRole("button", { name: "테마 변경" }).click()
  await page.getByRole("menuitem", { name: "Dark Mode", exact: true }).click()
  await page.keyboard.press("Escape")
  await page.locator('[role="menu"]').waitFor({ state: "detached" })
  await openPostAdditionalSettings(page)
  const fields = await page.locator("#title, #slug, #description").evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      return {
        background: style.backgroundColor,
        border: style.borderTopWidth,
        borderColor: style.borderTopColor,
      }
    }),
  )
  expect(fields).toHaveLength(3)
  expect(fields[0]).toEqual(fields[1])
  expect(fields[0]).toEqual(fields[2])
})
