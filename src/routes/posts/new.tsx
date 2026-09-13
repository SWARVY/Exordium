import { requireOwner } from "@features/auth/api/require-owner"
import { buildHead } from "@shared/constants/seo"
import { createFileRoute } from "@tanstack/react-router"
import { PostEditorForm } from "@widgets/post-editor"

export const Route = createFileRoute("/posts/new")({
  beforeLoad: requireOwner,
  head: () => buildHead({ title: "새 게시글 작성", path: "/posts/new", noIndex: true }),
  component: NewPostPage,
})

function NewPostPage() {
  return <PostEditorForm />
}
