import { useT } from "@shared/i18n"
import { cn } from "@shared/lib/utils"
import { Link } from "@tanstack/react-router"

interface PostTagLinkProps {
  tag: string
  wrap?: boolean
  onNavigate?: () => void
}

export function PostTagLink({ tag, wrap = false, onNavigate }: PostTagLinkProps) {
  const t = useT()
  return (
    <Link
      to="/posts"
      search={{ tag }}
      aria-label={t.post.viewTag(tag)}
      onClick={onNavigate}
      className="group/tag relative z-10 flex min-h-11 min-w-11 max-w-full items-center rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink"
    >
      <span
        className={cn(
          "post-tag min-w-0 group-hover/tag:border-primary-ink group-hover/tag:text-primary-ink group-focus-visible/tag:border-primary-ink group-focus-visible/tag:text-primary-ink",
          wrap ? "whitespace-normal [overflow-wrap:anywhere]" : "truncate",
        )}
      >
        {tag}
      </span>
    </Link>
  )
}
