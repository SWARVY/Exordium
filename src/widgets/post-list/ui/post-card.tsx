import { PostTags } from "@entities/post"
import { routes } from "@shared/constants/routes"
import { formatDate } from "@shared/lib/utils"
import { Link } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "lucide-react"
import { motion } from "motion/react"

import type { PostSummary } from "@entities/post"

interface PostCardProps {
  post: PostSummary
  index?: number
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const publishedDate = post.publishedAt ? formatDate(post.publishedAt) : null

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="post-card group relative isolate rounded-xs border border-border bg-card transition-[color,background-color,border-color,box-shadow] duration-200 has-[.post-card-link:hover]:border-primary"
    >
      <div className="min-w-0 flex-1">
        <h2 className="type-card-title line-clamp-2 text-foreground transition-colors has-[a:hover]:text-primary-ink">
          <Link
            to={routes.posts.detail(post.slug)}
            aria-label={post.title}
            className="post-card-link after:absolute after:inset-0 after:rounded-xs focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-primary-ink"
          >
            {post.title}
          </Link>
        </h2>
        {post.description && (
          <p className="type-summary mt-2 line-clamp-2 text-muted-foreground">{post.description}</p>
        )}
      </div>
      {post.tags.length > 0 && (
        <div className="min-w-0 shrink-0">
          <PostTags tags={post.tags} />
        </div>
      )}
      <div className="flex h-4 shrink-0 items-center justify-between">
        {publishedDate && (
          <time dateTime={post.publishedAt!} className="type-meta font-mono text-muted-foreground">
            {publishedDate}
          </time>
        )}
        <ArrowUpRightIcon
          aria-hidden="true"
          className="ml-auto size-4 text-muted-foreground transition-all group-has-[.post-card-link:hover]:translate-x-0.5 group-has-[.post-card-link:hover]:-translate-y-0.5 group-has-[.post-card-link:hover]:text-primary-ink"
        />
      </div>
    </motion.article>
  )
}
