import { supabase } from "@shared/api/supabase-client"
import { routes } from "@shared/constants/routes"
import { buildMeta } from "@shared/constants/seo"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { PostEditorForm } from "@widgets/post-editor"

export const Route = createFileRoute("/posts/new")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const isOwner = session?.user?.app_metadata?.role === "owner"
    if (!isOwner) throw redirect({ to: routes.home, replace: true })
  },
  head: () => ({
    meta: buildMeta({ title: "새 게시글 작성", path: "/posts/new" }),
  }),
  component: NewPostPage,
})

function NewPostPage() {
  return <PostEditorForm />
}
