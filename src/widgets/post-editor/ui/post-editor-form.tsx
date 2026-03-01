import { PostDraftSchema, type Post, type PostDraft } from "@entities/post"
import { useCreatePost } from "@features/create-post"
import { useUpdatePost } from "@features/update-post"
import { historyExtension, richTextExtension, type Extension } from "@jikjo/core"
import { createImageExtension } from "@jikjo/image"
import { EditorUI } from "@jikjo/ui-kit"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { postImageUploadAdapter } from "@shared/api/image-upload-adapter"
import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { Input } from "@shared/ui/components/input"
import { Label } from "@shared/ui/components/label"
import { useForm } from "@tanstack/react-form"
import { useNavigate } from "@tanstack/react-router"
import { BookOpenIcon, ClockIcon, TagIcon } from "lucide-react"
import { createElement, useCallback, useEffect, useMemo, useState } from "react"

import { useDraftAutoSave } from "../model/use-draft-auto-save"

import type { EditorState } from "lexical"

const baseExtensions: Extension[] = [
  richTextExtension,
  historyExtension,
  createImageExtension({ uploadAdapter: postImageUploadAdapter }),
]

interface PostEditorFormProps {
  post?: Post
}

export function PostEditorForm({ post }: PostEditorFormProps) {
  const t = useT()
  const navigate = useNavigate()
  const { mutate: createPost, isPending: isCreating } = useCreatePost()
  const { mutate: updatePost, isPending: isUpdating } = useUpdatePost()
  const isPending = isCreating || isUpdating

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)

  const isEditMode = Boolean(post)

  const form = useForm({
    formId: isEditMode ? `post-editor-${post?.id}` : "post-editor-new",
    defaultValues: {
      title: post?.title ?? "",
      description: post?.description ?? "",
      content: post?.content ?? "",
      slug: post?.slug ?? "",
      coverImage: post?.coverImage ?? "",
      tags: post?.tags ?? [],
    },
    validators: { onSubmit: PostDraftSchema },
    onSubmit: ({ value }) => {
      if (isEditMode && post) {
        updatePost(
          { id: post.id, draft: value as PostDraft },
          { onSuccess: (data) => navigate({ to: routes.posts.detail(data.slug) }) },
        )
      } else {
        createPost(value as PostDraft, {
          onSuccess: (data) => {
            clearDraft()
            navigate({ to: routes.posts.detail(data.slug) })
          },
        })
      }
    },
  })

  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      form.setFieldValue("content", JSON.stringify(editorState.toJSON()))
    },
    [form],
  )

  const extensions = useMemo<Extension[]>(
    () => [
      ...baseExtensions,
      {
        name: "on-change",
        plugins: [createElement(OnChangePlugin, { onChange: handleEditorChange })],
      },
    ],
    [handleEditorChange],
  )

  const { saveDraft, loadDraft, clearDraft } = useDraftAutoSave(() => form.state.values, post?.id)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: load draft only on mount
  useEffect(() => {
    if (!isEditMode) {
      const draft = loadDraft()
      if (draft) {
        if (draft.title) form.setFieldValue("title", draft.title)
        if (draft.description) form.setFieldValue("description", draft.description)
        if (draft.content) form.setFieldValue("content", draft.content)
        if (draft.slug) form.setFieldValue("slug", draft.slug)
        if (draft.savedAt) setDraftSavedAt(draft.savedAt)
      }
    }
  }, [])

  const handleManualSave = () => {
    saveDraft()
    setDraftSavedAt(new Date().toISOString())
  }

  const draftTimeLabel = draftSavedAt
    ? new Date(draftSavedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-0"
    >
      {/* ── Hero header ── */}
      <div className="grid-paper border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            — {isEditMode ? t.postEditor.editPost : t.postEditor.newPost}
          </span>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              {isEditMode ? t.postEditor.editPost : t.postEditor.newPost}
            </h1>
            {draftTimeLabel && (
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <ClockIcon className="size-3" />
                {t.postEditor.draftSaving(draftTimeLabel)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
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

            <form.Field name="title">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={field.name}
                    className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {t.postEditor.titleLabel}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t.postEditor.titlePlaceholder}
                    className="rounded-sm border-border bg-card text-sm font-semibold placeholder:font-normal placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="font-mono text-[10px] text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="slug">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={field.name}
                    className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {t.postEditor.slugLabel}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="my-post-title"
                    className="rounded-sm border-border bg-card font-mono text-xs focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="font-mono text-[10px] text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={field.name}
                    className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {t.postEditor.descLabel}
                  </Label>
                  <textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={4}
                    placeholder={t.postEditor.descPlaceholder}
                    className="w-full resize-none rounded-sm border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="font-mono text-[10px] text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="border-t border-dashed border-border" />

            <div className="rounded-sm border border-border bg-card p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary mb-3">
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
          <div className="flex flex-1 flex-col gap-3 min-w-0">
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
                namespace="post-editor"
                className="min-h-[560px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed FAB actions ── */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-8 sm:right-8">
        <button
          type="button"
          onClick={handleManualSave}
          className="rounded-full border border-border bg-background/95 px-4 py-2.5 shadow-md backdrop-blur-sm font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {draftTimeLabel ? t.action.draftSaved(draftTimeLabel) : t.action.draftSave}
        </button>
        <button
          type="button"
          onClick={() => history.back()}
          className="rounded-full border border-border bg-background/95 px-4 py-2.5 shadow-md backdrop-blur-sm font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          {t.action.cancel}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-3 shadow-lg shadow-primary/30 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? t.action.saving : isEditMode ? t.action.done : t.action.publish}
        </button>
      </div>
    </form>
  )
}
