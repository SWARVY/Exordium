import { ownerQueryOptions } from "@entities/owner"
import { postQueryOptions } from "@entities/post"
import { buildHead } from "@shared/constants/seo"
import { createFileRoute } from "@tanstack/react-router"
import { OwnerProfile } from "@widgets/owner-profile"
import { PostList } from "@widgets/post-list"

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(ownerQueryOptions.profile()),
      context.queryClient.prefetchInfiniteQuery(postQueryOptions.list({})),
    ]),
  head: () => buildHead({ path: "/" }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      {/* Hero — grid paper background */}
      <section className="grid-paper border-b border-border" aria-label="Profile">
        <div className="page-shell">
          <OwnerProfile />
        </div>
      </section>

      {/* Posts section */}
      <section className="page-shell section-space" aria-label="Recent posts">
        <div className="mb-6 sm:mb-8 flex items-end justify-between">
          <div>
            <span className="type-eyebrow text-primary-ink">— Writing</span>
            <h2 className="type-section mt-2 text-foreground">Recent Posts</h2>
          </div>
        </div>
        <PostList />
      </section>
    </>
  )
}
