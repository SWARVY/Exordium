import { postQueryOptions } from "@entities/post"
import { buildHead } from "@shared/constants/seo"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { PostDetail } from "@widgets/post-detail"

export const Route = createFileRoute("/posts/$slug")({
  loader: async ({ params, context }) => {
    const post = await context.queryClient.ensureQueryData(postQueryOptions.detail(params.slug))
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData, params }) =>
    buildHead({
      type: "article",
      title: loaderData?.title ?? params.slug,
      description: loaderData?.description ?? undefined,
      ogImage: loaderData?.coverImage ?? undefined,
      path: `/posts/${params.slug}`,
    }),
  component: PostDetailPage,
})

function PostDetailPage() {
  const { slug } = Route.useParams()

  return <PostDetail slug={slug} />
}
