import { siteConfigQueryOptions } from "@entities/site-config"
import { buildMeta } from "@shared/constants/seo"
import { useT } from "@shared/i18n"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { createFileRoute } from "@tanstack/react-router"
import { OpenSourceList } from "@widgets/open-source-list"
import { PageHero } from "@widgets/page-hero"

export const Route = createFileRoute("/projects/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteConfigQueryOptions.config()),
  head: () => ({
    meta: buildMeta({
      title: "Projects",
      description: "Projects list.",
      path: "/projects",
    }),
  }),
  component: ProjectsPage,
})

function ProjectsPage() {
  const t = useT()

  return (
    <>
      <AsyncBoundary
        fallback={
          <section className="grid-paper border-b border-border">
            <div className="mx-auto max-w-5xl px-6 py-16">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-14 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-4 w-80 animate-pulse rounded bg-muted" />
            </div>
          </section>
        }
      >
        <PageHero tag="Projects" title="Projects" subtitleKey="projectsSubtitle" />
      </AsyncBoundary>

      <section className="mx-auto max-w-5xl px-6 py-16" aria-label={t.aria.projectLoading}>
        <OpenSourceList />
      </section>
    </>
  )
}
