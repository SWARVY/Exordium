import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { afterEach, expect, it, vi } from "vitest"

import { SkillOrderField } from "./skill-order-field"

afterEach(cleanup)

function StatefulSkillOrderField() {
  const [skills, setSkills] = useState(["React", "TypeScript", "Vitest"])
  return <SkillOrderField skills={skills} onChange={setSkills} />
}

function mockWrappedSkillGeometry() {
  const handles = screen.getAllByRole("button", { name: /기술 순서 드래그/ })
  handles.forEach((handle, index) => {
    handle.parentElement!.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: index * 52,
      top: index * 52,
      right: 240,
      bottom: index * 52 + 44,
      left: 0,
      width: 240,
      height: 44,
      toJSON: () => null,
    }))
  })
}

it("moves a skill with a click alternative and announces the new position", () => {
  const onChange = vi.fn()
  render(<SkillOrderField skills={["React", "TypeScript"]} onChange={onChange} />)

  fireEvent.click(screen.getByRole("button", { name: "React 기술을 뒤로 이동" }))

  expect(onChange).toHaveBeenCalledWith(["TypeScript", "React"])
  expect(screen.getByText(/React 기술을 2개 중 2번째로 이동했습니다/).textContent).toContain(
    "저장하면 반영됩니다",
  )
  expect(screen.getByRole("button", { name: "React 기술 순서 드래그" })).not.toBeNull()
})

it("moves the focused skill with direction keys without depending on tag geometry", () => {
  const onChange = vi.fn()
  render(<SkillOrderField skills={["React", "TypeScript", "Vitest"]} onChange={onChange} />)

  fireEvent.keyDown(screen.getByRole("button", { name: "Vitest 기술 순서 드래그" }), {
    key: "ArrowLeft",
  })

  expect(onChange).toHaveBeenCalledWith(["React", "Vitest", "TypeScript"])
  expect(screen.getByText(/Vitest 기술을 3개 중 2번째로 이동했습니다/)).not.toBeNull()
})

it("does not also run direct movement while a keyboard drag is active", async () => {
  const onChange = vi.fn()
  render(<SkillOrderField skills={["React", "TypeScript", "Vitest"]} onChange={onChange} />)
  const dragHandle = screen.getByRole("button", { name: "Vitest 기술 순서 드래그" })

  fireEvent.keyDown(dragHandle, { key: " ", code: "Space" })
  expect(dragHandle.getAttribute("aria-pressed")).toBe("true")

  fireEvent.keyDown(dragHandle, { key: "ArrowLeft", code: "ArrowLeft" })

  expect(onChange).not.toHaveBeenCalled()
  fireEvent.keyDown(dragHandle, { key: "Escape", code: "Escape" })
  await waitFor(() => expect(dragHandle.getAttribute("aria-pressed")).toBeNull())
})

it("moves to the adjacent logical skill during a keyboard drag when tags wrap", async () => {
  render(<StatefulSkillOrderField />)
  mockWrappedSkillGeometry()
  const dragHandle = screen.getByRole("button", { name: "Vitest 기술 순서 드래그" })

  fireEvent.keyDown(dragHandle, { key: " ", code: "Space" })
  fireEvent.keyDown(dragHandle, { key: "ArrowLeft", code: "ArrowLeft" })
  fireEvent.keyDown(dragHandle, { key: " ", code: "Space" })

  await waitFor(() =>
    expect(
      screen
        .getAllByRole("button", { name: /기술 순서 드래그/ })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["React 기술 순서 드래그", "Vitest 기술 순서 드래그", "TypeScript 기술 순서 드래그"]),
  )
})

it("cancels a keyboard drag without changing the skill order", async () => {
  render(<StatefulSkillOrderField />)
  mockWrappedSkillGeometry()
  const dragHandle = screen.getByRole("button", { name: "Vitest 기술 순서 드래그" })

  fireEvent.keyDown(dragHandle, { key: " ", code: "Space" })
  fireEvent.keyDown(dragHandle, { key: "ArrowLeft", code: "ArrowLeft" })
  fireEvent.keyDown(dragHandle, { key: "Escape", code: "Escape" })

  await waitFor(() => expect(dragHandle.getAttribute("aria-pressed")).toBeNull())
  expect(
    screen
      .getAllByRole("button", { name: /기술 순서 드래그/ })
      .map((button) => button.getAttribute("aria-label")),
  ).toEqual(["React 기술 순서 드래그", "TypeScript 기술 순서 드래그", "Vitest 기술 순서 드래그"])
})

it("does not replay queued drag keys after the editor unmounts", async () => {
  vi.useFakeTimers()
  const forwardedKey = vi.fn()
  try {
    const { unmount } = render(<StatefulSkillOrderField />)
    const dragHandle = screen.getByRole("button", { name: "Vitest 기술 순서 드래그" })
    fireEvent.keyDown(dragHandle, { key: " ", code: "Space" })
    document.addEventListener("keydown", forwardedKey)
    fireEvent.keyDown(dragHandle, { key: "ArrowLeft", code: "ArrowLeft" })
    unmount()
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(forwardedKey).not.toHaveBeenCalled()
  } finally {
    document.removeEventListener("keydown", forwardedKey)
    vi.useRealTimers()
  }
})
