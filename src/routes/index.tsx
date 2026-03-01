import { buildMeta } from "@shared/constants/seo"
import { createFileRoute } from "@tanstack/react-router"
import { OwnerProfile } from "@widgets/owner-profile"
import { PostList } from "@widgets/post-list"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: buildMeta({ path: "/" }),
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <>
      {/* Hero — grid paper background */}
      <section className="grid-paper border-b border-border" aria-label="Profile">
        <div className="mx-auto max-w-5xl px-6">
          <OwnerProfile />
        </div>
      </section>

      {/* Posts section */}
      <section className="mx-auto max-w-5xl px-6 py-16" aria-label="Recent posts">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
              — Writing
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">
              Recent Posts
            </h2>
          </div>
        </div>
        <PostList />
      </section>
    </>
  )
}
