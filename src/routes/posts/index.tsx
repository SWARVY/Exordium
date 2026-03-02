import { siteConfigQueryOptions } from "@entities/site-config"
import { buildMeta } from "@shared/constants/seo"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { createFileRoute } from "@tanstack/react-router"
import { PageHero } from "@widgets/page-hero"
import { PostList } from "@widgets/post-list"

export const Route = createFileRoute("/posts/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteConfigQueryOptions.config()),
  head: () => ({
    meta: buildMeta({
      title: "Posts",
      description: "All posts.",
      path: "/posts",
    }),
  }),
  component: PostsPage,
})

function PostsPage() {
  return (
    <>
      <AsyncBoundary
        fallback={
          <section className="grid-paper border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-16">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-14 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-4 w-72 animate-pulse rounded bg-muted" />
            </div>
          </section>
        }
      >
        <PageHero tag="Writing" title="All Posts" subtitleKey="postsSubtitle" />
      </AsyncBoundary>

      {/* Post list */}
      <section className="mx-auto max-w-5xl px-6 py-16" aria-label="Post list">
        <PostList />
      </section>
    </>
  )
}
