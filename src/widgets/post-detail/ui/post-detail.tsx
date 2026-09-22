import { postQueryOptions, PostTags } from "@entities/post"
import { DeletePostButton } from "@features/delete-post"
import { routes } from "@shared/constants/routes"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { formatDate } from "@shared/lib/utils"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { useSuspenseQuery } from "@suspensive/react-query-5"
import { notFound, useNavigate } from "@tanstack/react-router"
import { CommentSection } from "@widgets/comment-section"
import { BookOpenIcon, CalendarIcon, PencilIcon } from "lucide-react"
import { motion } from "motion/react"
import { lazy, Suspense, useCallback, useState } from "react"

import { PostContent, estimateReadingTime } from "./post-content"
import { PostDetailSkeleton } from "./post-detail-skeleton"
import { PostReactions } from "./post-reactions"

interface PostDetailProps {
  slug: string
}

const InlineEditForm = lazy(() => import("./post-inline-editor"))

const POST_DETAIL_MOTION_ANIMATE = { opacity: 1, y: 0 }
const POST_DETAIL_MOTION_TRANSITION = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }
const POST_DETAIL_EDIT_MOTION_INITIAL = { opacity: 0 }
const POST_DETAIL_EDIT_MOTION_ANIMATE = { opacity: 1 }
const POST_DETAIL_EDIT_MOTION_TRANSITION = { duration: 0.2 }

// ── 뷰 모드 ──────────────────────────────────────────────────────
function PostDetailContent({ slug }: PostDetailProps) {
  const t = useT()
  const { data: post } = useSuspenseQuery(postQueryOptions.detail(slug))
  const isOwner = useIsOwner()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const closeEditor = useCallback(() => setIsEditing(false), [])
  const startEditor = useCallback(() => setIsEditing(true), [])
  const handleDeleteSuccess = useCallback(
    () => navigate({ to: routes.posts.list, replace: true }),
    [navigate],
  )

  if (!post) throw notFound()

  const publishedDate = post.publishedAt ? formatDate(post.publishedAt) : null

  const readingTime = estimateReadingTime(post.content)

  if (isEditing) {
    return (
      <motion.div
        initial={POST_DETAIL_EDIT_MOTION_INITIAL}
        animate={POST_DETAIL_EDIT_MOTION_ANIMATE}
        transition={POST_DETAIL_EDIT_MOTION_TRANSITION}
      >
        <Suspense fallback={<PostDetailSkeleton />}>
          <InlineEditForm post={post} onCancel={closeEditor} onSaved={closeEditor} />
        </Suspense>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={false}
      animate={POST_DETAIL_MOTION_ANIMATE}
      transition={POST_DETAIL_MOTION_TRANSITION}
    >
      {/* ── Hero header ── */}
      <div className="grid-paper border-b border-border">
        <div className="reading-shell reading-space">
          {post.tags.length > 0 && (
            <div className="mb-4">
              <PostTags tags={post.tags} />
            </div>
          )}

          <h1 className="type-page text-foreground">{post.title}</h1>

          {post.description && (
            <p className="type-body mt-4 max-w-2xl text-muted-foreground">{post.description}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {publishedDate && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <CalendarIcon className="size-3" />
                {publishedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <BookOpenIcon className="size-3" />
              {t.post.readingTime(readingTime)}
            </span>

            {isOwner && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEditor}
                  className="flex min-h-11 items-center gap-1.5 rounded-xs border border-border px-3 py-1 font-mono text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary-ink"
                >
                  <PencilIcon className="size-3" />
                  {t.action.edit}
                </button>
                <DeletePostButton postId={post.id} onSuccess={handleDeleteSuccess} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content (read-only) ── */}
      <div className="reading-shell reading-space">
        <PostContent content={post.content} />

        {/* ── Reactions ── */}
        <div className="mt-8 border-t border-border pt-6">
          <PostReactions postId={post.id} />
        </div>

        {/* ── Comments ── */}
        <CommentSection postId={post.id} />
      </div>
    </motion.div>
  )
}

export function PostDetail({ slug }: PostDetailProps) {
  return (
    <AsyncBoundary fallback={<PostDetailSkeleton />}>
      <PostDetailContent slug={slug} />
    </AsyncBoundary>
  )
}
