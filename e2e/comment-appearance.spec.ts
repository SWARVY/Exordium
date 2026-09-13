import { test, expect } from "./fixtures"

for (const width of [320, 1440]) {
  test(`comments share action sizes and readable compact inputs at ${width}px`, async ({
    page,
    actors,
    loginAs,
    createPost,
    database,
  }, testInfo) => {
    const post = await createPost()
    const { data: comment, error } = await database
      .from("comments")
      .insert({
        post_id: post.id,
        author_id: actors.reader.id,
        author_name: "E2E reader",
        content: "글 잘 읽었습니다.\n다음 글도 기대할게요.",
      })
      .select("id")
      .single()
    if (error) throw error
    const { error: replyError } = await database.from("comments").insert({
      post_id: post.id,
      parent_id: comment.id,
      author_id: actors.reader.id,
      author_name: "E2E reader",
      content: "추가로 남기는 답글입니다.",
    })
    if (replyError) throw replyError

    await page.setViewportSize({ width, height: 1000 })
    await loginAs(actors.reader)
    await page.goto(`/posts/${post.slug}`)
    const region = page.getByRole("region", { name: "댓글", exact: true })
    const actions = [
      region.getByRole("button", { name: "답글", exact: true }),
      region.getByRole("button", { name: "댓글 삭제", exact: true }),
      region.getByRole("button", { name: "답글 삭제", exact: true }),
    ]
    for (const action of actions) {
      await expect(action).toBeVisible()
      expect(
        await action.evaluate((el) => ({
          font: getComputedStyle(el).fontSize,
          height: el.getBoundingClientRect().height,
          width: el.getBoundingClientRect().width,
          cursor: getComputedStyle(el).cursor,
        })),
      ).toMatchObject({ font: "12px", height: 44, cursor: "pointer" })
      expect((await action.boundingBox())!.width).toBeGreaterThanOrEqual(44)
    }
    await actions[0].click()
    const inputs = await region.getByRole("textbox", { name: "댓글", exact: true }).all()
    expect(inputs).toHaveLength(2)
    for (const input of inputs) {
      await expect(input).toHaveValue("")
      expect(
        await input.evaluate((el) => ({
          text: getComputedStyle(el).fontSize,
          placeholder: getComputedStyle(el, "::placeholder").fontSize,
        })),
      ).toEqual({ text: width < 640 ? "16px" : "14px", placeholder: "14px" })
    }
    await region.scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath(`comments-${width}.png`), fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const replyInput = inputs[1]
    await replyInput.fill(Array.from({ length: 30 }, (_, i) => `답글 ${i}`).join("\n"))
    await replyInput.evaluate((el) => {
      el.scrollTop = 0
    })
    await replyInput.hover()
    const pageY = await page.evaluate(() => scrollY)
    await page.mouse.wheel(0, 120)
    await expect.poll(() => replyInput.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    expect(await page.evaluate(() => scrollY)).toBe(pageY)
    await region.getByRole("button", { name: "취소", exact: true }).click()
    await actions[2].click()
    const dialog = page.getByRole("dialog", { name: "답글 삭제", exact: true })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "취소", exact: true }).click()
    await expect(actions[2]).toBeFocused()
    await expect(region.getByText("추가로 남기는 답글입니다.", { exact: true })).toBeVisible()
  })
}
