import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { openSourceQueryOptions, type OpenSource } from "@entities/open-source"
import { postQueryOptions, type PostSummary } from "@entities/post"
import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowUpRightIcon, FileTextIcon, FolderGitIcon, SearchIcon, XIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
  returnFocus?: RefObject<HTMLElement | null>
}

export function SearchOverlay({ open, onClose, returnFocus }: SearchOverlayProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const focusSearch = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true })
    return false
  }, [])
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <DialogPrimitive.Popup
          initialFocus={focusSearch}
          finalFocus={returnFocus}
          className="fixed left-1/2 top-[10dvh] z-50 flex max-h-[80dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xs border border-input bg-background"
        >
          <DialogPrimitive.Title className="sr-only">{t.search.label}</DialogPrimitive.Title>
          {open && <SearchContent inputRef={inputRef} onClose={onClose} />}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function SearchContent({
  inputRef,
  onClose,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
}) {
  const t = useT()
  const [q, setQ] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const query = q.trim()
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250)
    return () => clearTimeout(timer)
  }, [query])
  const postsQuery = useQuery(postQueryOptions.search(debouncedQuery))
  const projectsQuery = useQuery(openSourceQueryOptions.search(debouncedQuery))
  const posts = postsQuery.data ?? []
  const projects = projectsQuery.data ?? []
  const isLoading = query !== debouncedQuery || postsQuery.isFetching || projectsQuery.isFetching
  const hasError = postsQuery.isError || projectsQuery.isError
  const hasResults = posts.length > 0 || projects.length > 0

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 focus-within:border-primary-ink">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          aria-label={t.search.label}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search.placeholder}
          className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus-visible:outline-none sm:text-sm"
        />
        <DialogPrimitive.Close
          aria-label={t.search.closeSearch}
          className="flex size-[44px] shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </div>
      {query && (
        <div className="min-h-0 overflow-y-auto p-4" aria-busy={isLoading}>
          {isLoading ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t.action.loading}
            </p>
          ) : hasError ? (
            <div role="alert" className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">{t.search.failed}</p>
              <button
                type="button"
                onClick={() => {
                  void postsQuery.refetch()
                  void projectsQuery.refetch()
                }}
                className="min-h-[44px] rounded-sm border border-border px-4 text-sm text-foreground hover:border-primary"
              >
                {t.action.retry}
              </button>
            </div>
          ) : !hasResults ? (
            <p role="status" className="break-words text-sm text-muted-foreground">
              {t.search.noResultsFor(query)}
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <p role="status" className="sr-only">
                {t.search.resultCount(posts.length + projects.length)}
              </p>
              {posts.length > 0 && (
                <SearchSection title={t.search.posts} icon={<FileTextIcon className="size-3.5" />}>
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
            </div>
          )}
        </div>
      )}
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
        <span className="font-mono text-xs font-semibold uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function PostResult({ post, onClose }: { post: PostSummary; onClose: () => void }) {
  return (
    <Link
      to={routes.posts.detail(post.slug)}
      onClick={onClose}
      className="group flex flex-col gap-1 rounded-sm border border-transparent px-4 py-3 transition-all hover:border-border hover:bg-card"
    >
      <span className="font-mono text-sm font-medium text-foreground transition-colors group-hover:text-primary-ink">
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
        <span className="font-mono text-sm font-medium text-foreground transition-colors group-hover:text-primary-ink">
          {project.name}
        </span>
        {project.description && (
          <span className="line-clamp-1 font-mono text-xs text-muted-foreground">
            {project.description}
          </span>
        )}
      </div>
      <ArrowUpRightIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-ink" />
    </a>
  )
}
