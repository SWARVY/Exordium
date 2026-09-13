import { siteConfigQueryOptions } from "@entities/site-config"
import { buildHead } from "@shared/constants/seo"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { createFileRoute } from "@tanstack/react-router"
import { PageHero } from "@widgets/page-hero"
import { PostList, PostTagFilter } from "@widgets/post-list"

export const Route = createFileRoute("/posts/")({
  validateSearch: (search: Record<string, unknown>): { tag?: string } => ({
    tag: typeof search.tag === "string" && search.tag.trim() ? search.tag : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteConfigQueryOptions.config()),
  head: () =>
    buildHead({
      title: "Posts",
      description: "All posts.",
      path: "/posts",
    }),
  component: PostsPage,
})

function PostsPage() {
  const { tag } = Route.useSearch()
  return (
    <>
      <AsyncBoundary
        fallback={
          <section className="grid-paper border-b border-border">
            <div className="page-shell section-space">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-14 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
            </div>
          </section>
        }
      >
        <PageHero tag="Writing" title="All Posts" subtitleKey="postsSubtitle" />
      </AsyncBoundary>

      {/* Post list */}
      <section className="page-shell section-space" aria-label="Post list">
        {tag && <PostTagFilter tag={tag} />}
        <PostList tag={tag} />
      </section>
    </>
  )
}
