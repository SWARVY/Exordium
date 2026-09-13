import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"

vi.mock("@shared/hooks/use-is-owner", () => ({ useIsOwner: () => true }))
vi.mock("@suspensive/react-query-5", () => ({
  useSuspenseQuery: () => ({
    data: {
      id: "owner-id",
      name: "Ada Lovelace",
      bio: "Builder",
      avatarUrl: null,
      githubUrl: null,
      twitterUrl: null,
      websiteUrl: null,
      skills: ["React"],
    },
  }),
}))
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: React.ComponentProps<"a"> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("./owner-profile-edit-form", () => ({
  OwnerProfileEditForm: ({
    onCancel,
    onSuccess,
  }: {
    onCancel: () => void
    onSuccess: () => void
  }) => (
    <div>
      <button type="button" onClick={onCancel}>
        취소
      </button>
      <button type="button" onClick={onSuccess}>
        저장
      </button>
    </div>
  ),
}))

import { WriteActionProvider } from "@shared/ui/providers/write-action-provider"
import { WriteFab } from "@widgets/header/ui/write-fab"

import { OwnerProfile } from "./owner-profile"

afterEach(cleanup)

it("hides the write action while profile editing and restores it after cancel or save", async () => {
  render(
    <WriteActionProvider>
      <OwnerProfile />
      <WriteFab />
    </WriteActionProvider>,
  )

  expect(screen.getByRole("link", { name: "새 게시글 작성" })).not.toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }))
  expect(await screen.findByRole("button", { name: "취소" })).not.toBeNull()
  expect(screen.queryByRole("link", { name: "새 게시글 작성" })).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "취소" }))
  expect(screen.getByRole("link", { name: "새 게시글 작성" })).not.toBeNull()

  fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }))
  expect(await screen.findByRole("button", { name: "저장" })).not.toBeNull()
  expect(screen.queryByRole("link", { name: "새 게시글 작성" })).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "저장" }))
  expect(screen.getByRole("link", { name: "새 게시글 작성" })).not.toBeNull()
})
