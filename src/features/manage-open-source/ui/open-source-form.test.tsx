import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

import { OpenSourceForm } from "./open-source-form"

afterEach(cleanup)

it("shows the validation message, connects it to the field, and focuses the first error", async () => {
  const onSubmit = vi.fn()
  render(<OpenSourceForm onSubmit={onSubmit} />)

  fireEvent.click(screen.getByRole("button", { name: "저장" }))

  const name = screen.getByRole("textbox", { name: "이름" })
  await waitFor(() => expect(document.activeElement).toBe(name))
  expect(name.getAttribute("aria-invalid")).toBe("true")
  expect(name.getAttribute("aria-describedby")).toBe("name-error")
  expect(screen.getByText("이름을 입력하세요").textContent).toBe("이름을 입력하세요")
  expect(onSubmit).not.toHaveBeenCalled()
})
