import { postQueryOptions } from "@entities/post"
import { useHydrated } from "@shared/hooks/use-hydrated"
import { useT } from "@shared/i18n"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { Button } from "@shared/ui/components/button"
import { SuspenseInfiniteQuery } from "@suspensive/react-query-5"

import { PostCard } from "./post-card"
import { PostListSkeleton } from "./post-list-skeleton"

interface PostListProps {
  tag?: string
}

export function PostList({ tag }: PostListProps) {
  const t = useT()
  const hydrated = useHydrated()

  return (
    <AsyncBoundary fallback={<PostListSkeleton />}>
      <SuspenseInfiniteQuery {...postQueryOptions.list({ tag })}>
        {({ data, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
          const posts = data.pages.flat()

          if (posts.length === 0) {
            return (
              <div
                role="status"
                className="rounded-sm border border-dashed border-border px-8 py-24 text-center"
              >
                <p className="font-mono text-sm font-medium text-foreground">
                  {tag ? t.post.noTaggedPosts : t.post.noPostsYet}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {tag ? t.post.noTaggedPostsDesc : t.post.noPostsDesc}
                </p>
              </div>
            )
          }

          return (
            <section aria-label={t.nav.posts}>
              <ul className="post-grid">
                {posts.map((post, index) => (
                  <li key={post.id}>
                    <PostCard post={post} index={index} />
                  </li>
                ))}
              </ul>
              {hasNextPage && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={!hydrated || isFetchingNextPage}
                    aria-label={t.aria.loadMore}
                    className="rounded-full border-primary font-mono text-xs uppercase tracking-widest text-primary-ink hover:bg-primary hover:text-primary-foreground"
                  >
                    {isFetchingNextPage ? t.action.loading : t.action.loadMore}
                  </Button>
                </div>
              )}
            </section>
          )
        }}
      </SuspenseInfiniteQuery>
    </AsyncBoundary>
  )
}
