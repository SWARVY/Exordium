import { postQueryOptions, PostBadge, type Post, type PostDraft } from "@entities/post"
import { DeletePostButton } from "@features/delete-post"
import { useUpdatePost } from "@features/update-post"
import { historyExtension, richTextExtension, type Extension } from "@jikjo/core"
import { createImageExtension } from "@jikjo/image"
import { EditorUI } from "@jikjo/ui-kit"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { postImageUploadAdapter } from "@shared/api/image-upload-adapter"
import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { Input } from "@shared/ui/components/input"
import { Label } from "@shared/ui/components/label"
import { useSuspenseQuery } from "@suspensive/react-query-5"
import { useNavigate } from "@tanstack/react-router"
import { CommentSection } from "@widgets/comment-section"
import { BookOpenIcon, CalendarIcon, PencilIcon, TagIcon } from "lucide-react"
import { motion } from "motion/react"
import { createElement, useCallback, useEffect, useMemo, useState } from "react"

import { PostDetailSkeleton } from "./post-detail-skeleton"
import { PostReactions } from "./post-reactions"

import type { EditorState } from "lexical"

interface PostDetailProps {
  slug: string
}

const viewerExtensions: Extension[] = [
  richTextExtension,
  historyExtension,
  createImageExtension({}),
]

const editorExtensions: Extension[] = [
  richTextExtension,
  historyExtension,
  createImageExtension({ uploadAdapter: postImageUploadAdapter }),
]


function estimateReadingTime(content: string): number {
  try {
    const parsed = JSON.parse(content)
    const text = JSON.stringify(parsed).replace(/"[^"]*":/g, "").replace(/[{}\[\],"]/g, " ")
    const words = text.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
  } catch {
    return 1
  }
}

// ── 인라인 편집 폼 (PostEditorForm과 동일한 레이아웃) ────────────────
interface InlineEditFormProps {
  post: Post
  onCancel: () => void
  onSaved: () => void
}

function InlineEditForm({ post, onCancel, onSaved }: InlineEditFormProps) {
  const t = useT()
  const { mutate: updatePost, isPending } = useUpdatePost()
  const navigate = useNavigate()

  const [title, setTitle] = useState(post.title)
  const [description, setDescription] = useState(post.description ?? "")
  const [slug, setSlug] = useState(post.slug)
  const [content, setContent] = useState(post.content)

  useEffect(() => {
    document.body.setAttribute("data-inline-editing", "")
    return () => document.body.removeAttribute("data-inline-editing")
  }, [])

  const handleEditorChange = useCallback((editorState: EditorState) => {
    setContent(JSON.stringify(editorState.toJSON()))
  }, [])

  const handleEditorInit = useCallback((editor: import("lexical").LexicalEditor) => {
    setTimeout(() => {
      try {
        const parsed = editor.parseEditorState(post.content)
        editor.setEditorState(parsed)
      } catch {
        // 유효하지 않은 JSON이면 빈 에디터로 시작
      }
      editor.setEditable(true)
    }, 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- post.content는 초기값만 사용
  }, [])

  const extensions = useMemo<Extension[]>(
    () => [
      ...editorExtensions,
      {
        name: "on-change",
        plugins: [createElement(OnChangePlugin, { onChange: handleEditorChange })],
      },
    ],
    [handleEditorChange],
  )

  const handleSubmit = () => {
    const draft: PostDraft = {
      title,
      description,
      slug,
      content,
      coverImage: post.coverImage ?? "",
      tags: post.tags,
    }
    updatePost(
      { id: post.id, draft },
      {
        onSuccess: (data) => {
          if (data.slug !== post.slug) {
            navigate({ to: routes.posts.detail(data.slug) })
          } else {
            onSaved()
          }
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {/* ── Hero header ── */}
      <div className="grid-paper border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            — {t.postEditor.editPost}
          </span>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {t.postEditor.editPost}
          </h1>
        </div>
      </div>

      {/* ── Two-column layout (PostEditorForm과 동일) ── */}
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">

          {/* Left: meta sidebar */}
          <aside className="flex flex-col gap-6 lg:w-64 lg:shrink-0">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <TagIcon className="size-3 text-primary" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
                Metadata
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-title"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {t.postEditor.titleLabel}
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.postEditor.titlePlaceholder}
                className="rounded-sm border-border bg-card text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-slug"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {t.postEditor.slugLabel}
              </Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-post-title"
                className="rounded-sm border-border bg-card font-mono text-xs focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="edit-description"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {t.postEditor.descLabel}
              </Label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={t.postEditor.descPlaceholder}
                className="w-full resize-none rounded-sm border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
              />
            </div>

            <div className="border-t border-dashed border-border" />

            <div className="rounded-sm border border-border bg-card p-4">
              <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
                // Tips
              </p>
              <ul className="flex flex-col gap-2">
                {[
                  t.postEditor.tipSlug,
                  t.postEditor.tipSlashBlock,
                  t.postEditor.tipFormat,
                ].map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-px shrink-0 text-primary">›</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right: editor */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <BookOpenIcon className="size-3 text-primary" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
                Content
              </span>
            </div>

            <div
              className="post-editor-wrap rounded-sm border border-border bg-card shadow-sm"
            >
              <EditorUI
                extensions={extensions}
                namespace={`post-editor-inline-${post.id}`}
                editable={true}
                className="min-h-[560px]"
                onEditor={handleEditorInit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed FAB actions (PostEditorForm과 동일) ── */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-8 sm:right-8">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border bg-background/95 px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground shadow-md backdrop-blur-sm transition-colors hover:border-foreground hover:text-foreground"
        >
          {t.action.cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? t.action.saving : t.action.done}
        </button>
      </div>
    </div>
  )
}

// ── 뷰 모드 ──────────────────────────────────────────────────────
function PostDetailContent({ slug }: PostDetailProps) {
  const t = useT()
  const { data: post } = useSuspenseQuery(postQueryOptions.detail(slug))
  const isOwner = useIsOwner()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  const readingTime = estimateReadingTime(post.content)

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <InlineEditForm
          post={post}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Hero header ── */}
      <div className="grid-paper border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-12">
          {post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <PostBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {post.title}
          </h1>

          {post.description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {post.description}
            </p>
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
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <PencilIcon className="size-3" />
                  {t.action.edit}
                </button>
                <DeletePostButton
                  postId={post.id}
                  onSuccess={() => navigate({ to: routes.posts.list, replace: true })}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content (read-only) ── */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div>
          <EditorUI
            namespace={`post-viewer-${post.id}`}
            extensions={viewerExtensions}
            editable={false}
            features={[]}
            className="prose prose-neutral dark:prose-invert max-w-none"
            onEditor={(editor) => {
              setTimeout(() => {
                try {
                  const parsed = editor.parseEditorState(post.content)
                  editor.setEditorState(parsed)
                } catch {
                  // content가 유효한 Lexical JSON이 아닌 경우 무시
                }
                editor.setEditable(false)
              }, 0)
            }}
          />
        </div>

        {/* ── Reactions ── */}
        <div className="mt-12 border-t border-border pt-8">
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
