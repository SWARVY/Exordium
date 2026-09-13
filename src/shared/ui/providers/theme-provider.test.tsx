import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

import { ThemeProvider, useThemeContext } from "./theme-provider"

function ThemeStatus() {
  const { mode } = useThemeContext()
  return <output aria-label="Current theme">{mode}</output>
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.className = ""
  document.documentElement.removeAttribute("style")
})

it("keeps the system dark preference when browser storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Storage disabled", "SecurityError")
  })
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }))

  render(
    <ThemeProvider>
      <ThemeStatus />
    </ThemeProvider>,
  )

  expect(screen.getByLabelText("Current theme").textContent).toBe("dark")
  expect(document.documentElement.classList.contains("dark")).toBe(true)
})
