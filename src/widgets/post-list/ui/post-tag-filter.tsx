import { useT } from "@shared/i18n"
import { buttonVariants } from "@shared/ui/components/button"
import { Link } from "@tanstack/react-router"
import { XIcon } from "lucide-react"

export function PostTagFilter({ tag }: { tag: string }) {
  const t = useT()
  return (
    <section
      aria-label={t.post.tagFilter}
      className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-4"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="type-summary text-muted-foreground">{t.post.tagFilter}</span>
        <span className="post-tag max-w-full whitespace-normal [overflow-wrap:anywhere]">
          {tag}
        </span>
      </div>
      <Link to="/posts" search={{}} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <XIcon aria-hidden="true" className="size-4" />
        {t.post.clearTagFilter}
      </Link>
    </section>
  )
}
