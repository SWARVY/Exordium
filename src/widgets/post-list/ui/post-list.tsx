import { postQueryOptions } from "@entities/post"
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

  return (
    <AsyncBoundary fallback={<PostListSkeleton />}>
      <SuspenseInfiniteQuery {...postQueryOptions.list({ tag })}>
        {({ data, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
          const posts = data.pages.flat()

          if (posts.length === 0) {
            return (
              <div className="rounded-sm border border-dashed border-border px-8 py-24 text-center">
                <p className="font-mono text-sm font-medium text-foreground">{t.post.noPostsYet}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">{t.post.noPostsDesc}</p>
              </div>
            )
          }

          return (
            <section aria-label={t.aria.postListLoading}>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    disabled={isFetchingNextPage}
                    aria-label={t.aria.loadMore}
                    className="rounded-full border-primary font-mono text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground"
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
