import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

const upload = vi.fn()
const remove = vi.fn()
vi.mock("@shared/api/supabase-client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload,
        remove,
        getPublicUrl: () => ({ data: { publicUrl: "https://example.test/new.png" } }),
      }),
    },
  },
}))

import { AvatarField } from "./avatar-field"

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

function drop(files: File[]) {
  return {
    dataTransfer: {
      files,
      types: ["Files"],
      items: files.map((file) => ({
        kind: "file",
        type: file.type,
        getAsFile: () => file,
      })),
    },
  }
}

it("accepts one dropped image, blocks another while uploading, and reports the staged result", async () => {
  let finish!: (value: { error: null }) => void
  upload.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const onChange = vi.fn()
  const onBusyChange = vi.fn()
  render(
    <AvatarField
      value={null}
      stagedAvatar={null}
      onChange={onChange}
      onBusyChange={onBusyChange}
    />,
  )
  const zone = screen.getByRole("button", { name: "프로필 이미지 업로드" })
  const file = new File(["png"], "avatar.png", { type: "image/png" })
  await act(async () => {
    fireEvent.drop(zone, drop([file]))
  })
  await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
  expect(zone.getAttribute("aria-disabled")).toBe("true")
  await act(async () => {
    fireEvent.drop(zone, drop([file]))
  })
  expect(upload).toHaveBeenCalledTimes(1)
  await act(async () => {
    finish({ error: null })
  })
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ url: "https://example.test/new.png" }),
  )
  expect(onBusyChange.mock.calls.map(([busy]) => busy)).toEqual([true, false])
})

it("rejects multiple dropped files without uploading or replacing the current avatar", async () => {
  const onChange = vi.fn()
  render(
    <AvatarField
      value="https://example.test/current.png"
      stagedAvatar={null}
      onChange={onChange}
      onBusyChange={() => {}}
    />,
  )
  const files = ["first", "second"].map(
    (name) => new File(["png"], `${name}.png`, { type: "image/png" }),
  )
  await act(async () => {
    fireEvent.drop(screen.getByRole("button", { name: "프로필 이미지 업로드" }), drop(files))
  })
  expect((await screen.findByRole("alert")).textContent).toContain("한 장")
  expect(upload).not.toHaveBeenCalled()
  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByRole("img", { name: "avatar preview" }).getAttribute("src")).toBe(
    "https://example.test/current.png",
  )
})
