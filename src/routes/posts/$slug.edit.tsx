import { postQueryOptions } from "@entities/post"
import { requireOwner } from "@features/auth/api/require-owner"
import { buildMeta } from "@shared/constants/seo"
import { Skeleton } from "@shared/ui/components/skeleton"
import { useSuspenseQuery } from "@suspensive/react-query-5"
import { createFileRoute } from "@tanstack/react-router"
import { PostEditorForm } from "@widgets/post-editor"
import { Suspense } from "react"

export const Route = createFileRoute("/posts/$slug/edit")({
  beforeLoad: requireOwner,
  head: ({ params }) => ({
    meta: buildMeta({
      title: "게시글 수정",
      path: `/posts/${params.slug}/edit`,
    }),
  }),
  component: EditPostPage,
})

function EditPostContent({ slug }: { slug: string }) {
  const { data: post } = useSuspenseQuery(postQueryOptions.detail(slug))
  return <PostEditorForm post={post} />
}

function EditPostPage() {
  const { slug } = Route.useParams()

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <EditPostContent slug={slug} />
    </Suspense>
  )
}
