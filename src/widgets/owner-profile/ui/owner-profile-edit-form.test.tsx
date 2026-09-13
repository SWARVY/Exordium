import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const upload = vi.fn()
const remove = vi.fn()
const getPublicUrl = vi.fn()
const updateProfile = vi.fn()
const resetUpdateProfile = vi.fn()
let saveError = false

vi.mock("@features/update-profile", () => ({
  useUpdateProfile: () => ({
    mutate: updateProfile,
    isPending: false,
    isError: saveError,
    reset: resetUpdateProfile,
  }),
}))

vi.mock("@shared/api/supabase-client", () => ({
  supabase: {
    storage: {
      from: () => ({ upload, remove, getPublicUrl }),
    },
  },
}))

import { OwnerProfileEditForm } from "./owner-profile-edit-form"

const profile = {
  id: "owner-id",
  name: "Ada Lovelace",
  bio: "Builder",
  avatarUrl: "https://example.com/storage/v1/object/public/avatars/published.png",
  githubUrl: null,
  twitterUrl: null,
  websiteUrl: null,
  skills: ["React", "TypeScript"],
}

beforeEach(() => {
  saveError = false
  upload.mockResolvedValue({ error: null })
  remove.mockResolvedValue({ error: null })
  getPublicUrl.mockReturnValue({
    data: { publicUrl: "https://example.com/storage/v1/object/public/avatars/staged.png" },
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("profile avatar lifecycle", () => {
  function avatarInput() {
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("Avatar input was not rendered")
    return input
  }

  it("rejects files over 2MB before uploading", async () => {
    render(<OwnerProfileEditForm profile={profile} onCancel={() => {}} onSuccess={() => {}} />)
    expect(screen.getByLabelText("프로필 이미지")).toBe(avatarInput())
    const oversized = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "avatar.png", {
      type: "image/png",
    })

    fireEvent.change(avatarInput(), { target: { files: [oversized] } })

    expect((await screen.findByRole("alert")).textContent).toContain("2MB")
    expect(upload).not.toHaveBeenCalled()
  })

  it("rejects unsupported image formats before uploading", async () => {
    render(<OwnerProfileEditForm profile={profile} onCancel={() => {}} onSuccess={() => {}} />)
    const gif = new File(["invalid"], "avatar.gif", { type: "image/gif" })

    fireEvent.change(avatarInput(), { target: { files: [gif] } })

    expect((await screen.findByRole("alert")).textContent).toContain("JPEG, PNG, WebP")
    expect(upload).not.toHaveBeenCalled()
  })

  it("uploads to a unique path and removes only that staged image on cancel", async () => {
    const onCancel = vi.fn()
    render(<OwnerProfileEditForm profile={profile} onCancel={onCancel} onSuccess={() => {}} />)
    const file = new File(["valid"], "avatar.png", { type: "image/png" })

    fireEvent.change(avatarInput(), { target: { files: [file] } })
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
    const stagedPath = upload.mock.calls[0][0]
    expect(stagedPath).not.toBe("avatar.png")
    expect(upload.mock.calls[0][2]).toMatchObject({ upsert: false })

    fireEvent.click(screen.getByRole("button", { name: "취소" }))

    await waitFor(() => expect(remove).toHaveBeenCalledWith([stagedPath]))
    expect(remove).not.toHaveBeenCalledWith(["published.png"])
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("keeps the published image visible and offers retry after upload failure", async () => {
    upload.mockResolvedValueOnce({ error: new Error("Storage unavailable") })
    render(<OwnerProfileEditForm profile={profile} onCancel={() => {}} onSuccess={() => {}} />)
    const file = new File(["valid"], "avatar.webp", { type: "image/webp" })

    fireEvent.change(avatarInput(), { target: { files: [file] } })

    expect((await screen.findByRole("alert")).textContent).toContain("업로드")
    expect(screen.getByRole("img", { name: "avatar preview" }).getAttribute("src")).toBe(
      profile.avatarUrl,
    )

    upload.mockResolvedValueOnce({ error: null })
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2))
  })

  it("commits the staged URL only when the profile is saved", async () => {
    const onSuccess = vi.fn()
    render(<OwnerProfileEditForm profile={profile} onCancel={() => {}} onSuccess={onSuccess} />)
    const file = new File(["valid"], "avatar.jpg", { type: "image/jpeg" })

    fireEvent.change(avatarInput(), { target: { files: [file] } })
    await screen.findByText("새 이미지가 준비되었습니다. 저장하면 공개 프로필에 반영됩니다.")
    expect(updateProfile).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1))
    expect(updateProfile.mock.calls[0][0].avatarUrl).toBe(
      "https://example.com/storage/v1/object/public/avatars/staged.png",
    )
    expect(onSuccess).not.toHaveBeenCalled()
    updateProfile.mock.calls[0][1].onSuccess()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(remove).not.toHaveBeenCalled()
  })
  it("blocks retry and implicit submission while another avatar is uploading", async () => {
    saveError = true
    let finishUpload!: (value: { error: null }) => void
    upload.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishUpload = resolve
        }),
    )
    render(<OwnerProfileEditForm profile={profile} onCancel={() => {}} onSuccess={() => {}} />)
    fireEvent.change(avatarInput(), {
      target: { files: [new File(["valid"], "next.png", { type: "image/png" })] },
    })
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
    expect((screen.getByRole("button", { name: "다시 시도" }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    fireEvent.submit(screen.getByRole("form"))
    await waitFor(() => expect(resetUpdateProfile).not.toHaveBeenCalled())
    expect(updateProfile).not.toHaveBeenCalled()

    finishUpload({ error: null })
    await screen.findByText("새 이미지가 준비되었습니다. 저장하면 공개 프로필에 반영됩니다.")
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1))
    expect(updateProfile.mock.calls[0][0].avatarUrl).toContain("staged.png")
  })
})
