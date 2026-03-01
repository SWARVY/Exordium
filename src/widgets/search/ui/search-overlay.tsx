import { postQueryOptions, type Post } from "@entities/post"
import { openSourceQueryOptions, type OpenSource } from "@entities/open-source"
import { useT } from "@shared/i18n"
import { routes } from "@shared/constants/routes"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowUpRightIcon, FileTextIcon, FolderGitIcon, SearchIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

function useSearch(q: string) {
  const { data: posts = [], isFetching: postsLoading } = useQuery(postQueryOptions.search(q))
  const { data: projects = [], isFetching: projectsLoading } = useQuery(openSourceQueryOptions.search(q))
  return { posts, projects, isLoading: postsLoading || projectsLoading }
}

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const t = useT()
  const [q, setQ] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { posts, projects, isLoading } = useSearch(q)

  const hasQuery = q.trim().length > 0
  const hasResults = posts.length > 0 || projects.length > 0

  useEffect(() => {
    if (open) {
      setQ("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-[10vh] z-50 w-full max-w-xl -translate-x-1/2 px-4"
        role="dialog"
        aria-modal="true"
        aria-label={t.search.label}
      >
        <div className="flex flex-col rounded-sm border border-border bg-background shadow-2xl shadow-black/20">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search.placeholder}
              className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={t.search.closeSearch}
              className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          {/* Results */}
          {hasQuery && (
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-6 p-4">
                {isLoading ? (
                  <p className="font-mono text-xs text-muted-foreground">{t.action.loading}</p>
                ) : !hasResults ? (
                  <p className="font-mono text-sm text-muted-foreground">{t.search.noResultsFor(q)}</p>
                ) : (
                  <>
                    {posts.length > 0 && (
                      <SearchSection
                        title={t.search.posts}
                        icon={<FileTextIcon className="size-3.5" />}
                      >
                        {posts.map((post) => (
                          <PostResult key={post.id} post={post} onClose={onClose} />
                        ))}
                      </SearchSection>
                    )}
                    {projects.length > 0 && (
                      <SearchSection
                        title={t.search.projects}
                        icon={<FolderGitIcon className="size-3.5" />}
                      >
                        {projects.map((project) => (
                          <ProjectResult key={project.id} project={project} onClose={onClose} />
                        ))}
                      </SearchSection>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function SearchSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function PostResult({ post, onClose }: { post: Post; onClose: () => void }) {
  return (
    <Link
      to={routes.posts.detail(post.slug)}
      onClick={onClose}
      className="group flex flex-col gap-1 rounded-sm border border-transparent px-4 py-3 transition-all hover:border-border hover:bg-card"
    >
      <span className="font-mono text-sm font-medium text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </span>
      {post.description && (
        <span className="line-clamp-1 font-mono text-xs text-muted-foreground">
          {post.description}
        </span>
      )}
    </Link>
  )
}

function ProjectResult({ project, onClose }: { project: OpenSource; onClose: () => void }) {
  return (
    <a
      href={project.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClose}
      className="group flex items-start justify-between gap-2 rounded-sm border border-transparent px-4 py-3 transition-all hover:border-border hover:bg-card"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {project.name}
        </span>
        {project.description && (
          <span className="line-clamp-1 font-mono text-xs text-muted-foreground">
            {project.description}
          </span>
        )}
      </div>
      <ArrowUpRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
    </a>
  )
}
