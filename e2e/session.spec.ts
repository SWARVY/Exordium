import { test, expect } from "./fixtures"

test("owner session survives a direct authoring URL and refresh", async ({
  page,
  actors,
  loginAs,
}) => {
  await loginAs(actors.owner)
  await page.goto("/posts/new")
  await expect(page).toHaveURL(/\/posts\/new$/)
  await expect(page.getByRole("textbox").first()).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/posts\/new$/)
})

test("reader cannot directly open an editor and an owner request does not leak into the next visitor", async ({
  page,
  browser,
  actors,
  loginAs,
}) => {
  await loginAs(actors.owner)
  await page.goto("/posts/new")
  await expect(page).toHaveURL(/\/posts\/new$/)
  const visitor = await browser.newContext({ baseURL: "http://127.0.0.1:4317" })
  const visitorPage = await visitor.newPage()
  await visitorPage.goto("/posts/new")
  await expect(visitorPage).toHaveURL("http://127.0.0.1:4317/")
  await visitor.close()
  await loginAs(actors.reader)
  await page.goto("/posts/new")
  await expect(page).toHaveURL("http://127.0.0.1:4317/")
})

test("an OAuth cancellation shows recovery instead of a successful redirect", async ({ page }) => {
  await page.goto("/auth/callback?error=access_denied")
  await expect(page.getByRole("alert")).toContainText("로그인을 완료하지 못했어요")
  await expect(page.getByRole("button", { name: "Login", exact: true }).last()).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/callback/)
})

test("logout removes the owner session from direct routes", async ({ page, actors, loginAs }) => {
  await loginAs(actors.owner)
  await page.goto("/")
  await page.getByRole("button", { name: "Logout", exact: true }).first().click()
  await expect(page.getByRole("button", { name: "Login", exact: true }).first()).toBeVisible()
  await page.goto("/posts/new")
  await expect(page).toHaveURL("http://127.0.0.1:4317/")
})
