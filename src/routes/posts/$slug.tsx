import { postQueryOptions } from "@entities/post"
import { buildMeta } from "@shared/constants/seo"
import { queryClient } from "@shared/lib/query-client"
import { createFileRoute } from "@tanstack/react-router"
import { PostDetail } from "@widgets/post-detail"

export const Route = createFileRoute("/posts/$slug")({
  loader: ({ params }) => queryClient.ensureQueryData(postQueryOptions.detail(params.slug)),
  head: ({ loaderData, params }) => ({
    meta: buildMeta({
      title: loaderData?.title ?? params.slug,
      description: loaderData?.description ?? undefined,
      ogImage: loaderData?.coverImage ?? undefined,
      path: `/posts/${params.slug}`,
    }),
  }),
  component: PostDetailPage,
})

function PostDetailPage() {
  const { slug } = Route.useParams()

  return <PostDetail slug={slug} />
}
