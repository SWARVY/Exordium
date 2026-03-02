import { formatDate } from "@shared/lib/utils"
import { routes } from "@shared/constants/routes"
import { Link } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "lucide-react"
import { motion } from "motion/react"

import type { Post } from "@entities/post"

interface PostCardProps {
  post: Post
  index?: number
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const publishedDate = post.publishedAt ? formatDate(post.publishedAt) : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={routes.posts.detail(post.slug)}
        aria-label={post.title}
        className="group flex h-full flex-col gap-4 rounded-sm border border-border bg-card p-6 transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0_0_var(--color-primary)]"
      >
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="flex-1">
          <h2 className="text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {post.title}
          </h2>
          {post.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {post.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {publishedDate && (
            <time
              dateTime={post.publishedAt!}
              className="font-mono text-xs text-muted-foreground"
            >
              {publishedDate}
            </time>
          )}
          <ArrowUpRightIcon className="size-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ml-auto" />
        </div>
      </Link>
    </motion.article>
  )
}
