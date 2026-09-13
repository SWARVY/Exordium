import { PostDraftSchema, type Post, type PostDraft } from "@entities/post"
import { useCreatePost } from "@features/create-post"
import { PostUpdateConflictError, useUpdatePost } from "@features/update-post"
import { routes } from "@shared/constants/routes"
import { useAuth } from "@shared/hooks/use-auth"
import { useHydrated } from "@shared/hooks/use-hydrated"
import { useT } from "@shared/i18n"
import { Button } from "@shared/ui/components/button"
import { FieldError } from "@shared/ui/components/field-error"
import { Input } from "@shared/ui/components/input"
import { Label } from "@shared/ui/components/label"
import { Textarea } from "@shared/ui/components/textarea"
import { useForm } from "@tanstack/react-form"
import { useNavigate } from "@tanstack/react-router"
import { AlertTriangleIcon, ClockIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { validatePostDocument, type PostDocumentValidation } from "../model/post-document"
import { type StoredPostDraft } from "../model/use-draft-auto-save"
import { usePostEditorDraftWorkflow } from "../model/use-post-editor-draft-workflow"
import { PostDocumentEditor } from "./post-document-editor"
import { PostEditorActions } from "./post-editor-actions"
import { PostEditorAdditionalSettings } from "./post-editor-additional-settings"
import { PostEditorDraftDialogs } from "./post-editor-draft-dialogs"

interface PostEditorFormProps {
  post?: Post
  onCancel?: () => void
  onSaved?: () => void
}

function initialValues(post?: Post): PostDraft {
  return {
    title: post?.title ?? "",
    description: post?.description ?? "",
    content: post?.content ?? "",
    slug: post?.slug ?? "",
    coverImage: post?.coverImage ?? "",
    tags: post?.tags ?? [],
  }
}

function formatSavedTime(savedAt: string) {
  return new Date(savedAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PostEditorForm({ post, onCancel, onSaved }: PostEditorFormProps) {
  const t = useT()
  const hydrated = useHydrated()
  const { user, isLoading: authLoading } = useAuth()
  const draftOwnerRef = useRef(user?.id)
  if (!draftOwnerRef.current && user?.id) draftOwnerRef.current = user.id
  const navigate = useNavigate()
  const createMutation = useCreatePost()
  const updateMutation = useUpdatePost()
  const isEditMode = Boolean(post)
  const isPending = createMutation.isPending || updateMutation.isPending
  const saveFailed = createMutation.isError || updateMutation.isError
  const updateConflict = updateMutation.error instanceof PostUpdateConflictError
  const interactiveReady =
    hydrated && !authLoading && Boolean(user) && user?.id === draftOwnerRef.current
  const original = initialValues(post)

  const [documentValue, setDocumentValue] = useState(original.content)
  const [tagsText, setTagsText] = useState(original.tags.join(", "))
  const [documentRevision, setDocumentRevision] = useState(0)
  const [documentLoadFailed, setDocumentLoadFailed] = useState(false)
  const [documentValidation, setDocumentValidation] = useState<PostDocumentValidation | null>(null)
  const [editBaseline, setEditBaseline] = useState(post?.updatedAt)
  const [draftVersionConflict, setDraftVersionConflict] = useState(false)
  const [additionalSettingsOpen, setAdditionalSettingsOpen] = useState(false)
  const [invalidFocusRequest, setInvalidFocusRequest] = useState(0)
  const formElementRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (invalidFocusRequest === 0) return
    formElementRef.current
      ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input[aria-invalid="true"], textarea[aria-invalid="true"]',
      )
      ?.focus()
  }, [invalidFocusRequest])

  const leaveEditor = useCallback(() => {
    if (onCancel) {
      onCancel()
      return
    }
    history.back()
  }, [onCancel])

  const form = useForm({
    formId: isEditMode ? `post-editor-${post?.id}` : "post-editor-new",
    defaultValues: original,
    validators: { onSubmit: PostDraftSchema },
    onSubmitInvalid: () => {
      setAdditionalSettingsOpen(true)
      setInvalidFocusRequest((request) => request + 1)
    },
    onSubmit: ({ value }) => {
      if (isPending || !interactiveReady) return
      const validation = validatePostDocument(value.content)
      setDocumentValidation(validation)
      if (
        validation !== "valid" ||
        documentLoadFailed ||
        draftVersionConflict ||
        draftWorkflow.draftDecision.status === "ready" ||
        draftWorkflow.draftDecision.status === "corrupt"
      ) {
        return
      }
      if (isEditMode && post) {
        updateMutation.mutate(
          {
            id: post.id,
            draft: value as PostDraft,
            updatedAt: editBaseline ?? post.updatedAt,
            previousSlug: post.slug,
          },
          { onSuccess: (data) => finishSave(data.slug) },
        )
        return
      }
      createMutation.mutate(value as PostDraft, {
        onSuccess: (data) => finishSave(data.slug),
      })
    },
  })

  const replaceEditorDocument = (content: string) => {
    form.setFieldValue("content", content)
    setDocumentValue(content)
    setDocumentRevision((revision) => revision + 1)
    setDocumentLoadFailed(false)
    setDocumentValidation(null)
  }

  const applyDraft = (draft: StoredPostDraft) => {
    form.setFieldValue("title", draft.title ?? original.title)
    form.setFieldValue("description", draft.description ?? original.description)
    form.setFieldValue("slug", draft.slug ?? original.slug)
    form.setFieldValue("coverImage", draft.coverImage ?? original.coverImage)
    form.setFieldValue("tags", draft.tags ?? original.tags)
    setTagsText((draft.tags ?? original.tags).join(", "))
    if (post) {
      setEditBaseline(draft.baseUpdatedAt ?? "")
      setDraftVersionConflict(draft.baseUpdatedAt !== post.updatedAt)
    }
    replaceEditorDocument(draft.content ?? original.content)
  }

  const applyOriginal = () => {
    form.setFieldValue("title", original.title)
    form.setFieldValue("description", original.description)
    form.setFieldValue("slug", original.slug)
    form.setFieldValue("coverImage", original.coverImage)
    form.setFieldValue("tags", original.tags)
    setTagsText(original.tags.join(", "))
    setEditBaseline(post?.updatedAt)
    setDraftVersionConflict(false)
    replaceEditorDocument(original.content)
  }

  const draftWorkflow = usePostEditorDraftWorkflow({
    getValue: () => ({
      ...form.state.values,
      ...(post ? { baseUpdatedAt: editBaseline } : {}),
    }),
    postId: post?.id,
    ownerId: draftOwnerRef.current,
    identityReady: interactiveReady,
    persistenceAllowed: !documentLoadFailed,
    applyDraft,
    applyOriginal,
    onLeave: leaveEditor,
  })
  const markDirty = draftWorkflow.markDirty
  const clearDraftAfterSave = draftWorkflow.finishSave

  const handleEditorChange = useCallback(
    (content: string) => {
      form.setFieldValue("content", content)
      setDocumentValidation(null)
      markDirty()
    },
    [form, markDirty],
  )

  const finishSave = useCallback(
    (slug: string) => {
      clearDraftAfterSave()
      if (onSaved && slug === post?.slug) {
        onSaved()
        return
      }
      navigate({ to: routes.posts.detail(slug) })
    },
    [clearDraftAfterSave, navigate, onSaved, post?.slug],
  )

  const draftTimeLabel = draftWorkflow.draftSavedAt
    ? formatSavedTime(draftWorkflow.draftSavedAt)
    : null
  const submitDisabled =
    isPending || draftWorkflow.draftDecisionBlocksSave || documentLoadFailed || draftVersionConflict
  const documentValidationMessage =
    documentValidation === "empty"
      ? t.editing.contentRequired
      : documentValidation === "invalid"
        ? t.editing.documentInvalid
        : null

  return (
    <>
      <form
        ref={formElementRef}
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
        className="flex flex-col gap-0 pb-44 sm:pb-28"
      >
        <fieldset disabled={!interactiveReady || isPending} className="contents">
          <div className="grid-paper border-b border-border">
            <div className="page-shell py-6 sm:py-8">
              <div className="flex items-center justify-between gap-4">
                <h1 className="form-heading text-foreground">
                  {isEditMode ? t.postEditor.editPost : t.postEditor.newPost}
                </h1>
                {draftTimeLabel ? (
                  <div className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:flex">
                    <ClockIcon className="size-3" />
                    {t.postEditor.draftSaving(draftTimeLabel)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="page-shell py-6 sm:py-8">
            {(draftWorkflow.draftMessage ||
              saveFailed ||
              documentLoadFailed ||
              draftVersionConflict ||
              documentValidationMessage) && (
              <div
                id="post-editor-error"
                role="alert"
                className="mb-6 flex items-start gap-3 border border-destructive bg-card p-4 text-sm text-destructive"
              >
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                <div className="flex flex-col items-start gap-3">
                  <span>
                    {documentLoadFailed
                      ? t.editing.documentLoadFailed
                      : documentValidationMessage
                        ? documentValidationMessage
                        : draftVersionConflict || updateConflict
                          ? t.editing.updateConflict
                          : saveFailed
                            ? t.editing.saveFailed
                            : draftWorkflow.draftMessage}
                  </span>
                  {(documentLoadFailed || draftVersionConflict) && draftWorkflow.restoredDraft ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={draftWorkflow.recoverOriginalDocument}
                    >
                      {t.editing.useOriginalDocument}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            <div className="grid gap-5 lg:gap-x-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <form.Field name="title">
                {(field) => {
                  const errorId = `${field.name}-error`
                  const invalid = field.state.meta.errors.length > 0
                  return (
                    <div className="flex flex-col gap-1.5 lg:col-start-1 lg:row-start-1">
                      <Label htmlFor={field.name} className="form-label">
                        {t.postEditor.titleLabel}
                      </Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          markDirty()
                        }}
                        onBlur={field.handleBlur}
                        placeholder={t.postEditor.titlePlaceholder}
                        aria-invalid={invalid}
                        aria-describedby={invalid ? errorId : undefined}
                        className="font-semibold placeholder:font-normal"
                      />
                      <FieldError errors={field.state.meta.errors} id={errorId} />
                    </div>
                  )
                }}
              </form.Field>
              <div className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-start-2">
                <span className="form-label">{t.editing.contentLabel}</span>
                <div
                  className="post-editor-wrap rounded-xs border border-input bg-card focus-within:border-primary-ink"
                  aria-invalid={documentLoadFailed || Boolean(documentValidationMessage)}
                  aria-describedby={
                    documentLoadFailed || documentValidationMessage
                      ? "post-editor-error"
                      : undefined
                  }
                >
                  {interactiveReady ? (
                    <PostDocumentEditor
                      key={documentRevision}
                      initialDocument={documentValue}
                      namespace={`post-editor-${post?.id ?? "new"}-${documentRevision}`}
                      label={t.editing.contentLabel}
                      editable={!isPending}
                      onChange={handleEditorChange}
                      onLoadError={() => setDocumentLoadFailed(true)}
                    />
                  ) : (
                    <div aria-hidden="true" className="min-h-[360px] sm:min-h-[560px]" />
                  )}
                </div>
              </div>
              <PostEditorAdditionalSettings
                label={t.editing.additionalSettings}
                open={additionalSettingsOpen}
                onOpenChange={setAdditionalSettingsOpen}
                tips={[t.postEditor.tipSlug, t.postEditor.tipSlashBlock, t.postEditor.tipFormat]}
              >
                <form.Field name="slug">
                  {(field) => {
                    const errorId = `${field.name}-error`
                    const invalid = field.state.meta.errors.length > 0
                    return (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={field.name} className="form-label">
                          {t.postEditor.slugLabel}
                        </Label>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onChange={(event) => {
                            field.handleChange(event.target.value)
                            markDirty()
                          }}
                          onBlur={field.handleBlur}
                          placeholder="my-post-title"
                          aria-invalid={invalid}
                          aria-describedby={invalid ? errorId : undefined}
                          className="font-mono"
                        />
                        <FieldError errors={field.state.meta.errors} id={errorId} />
                      </div>
                    )
                  }}
                </form.Field>

                <form.Field name="description">
                  {(field) => {
                    const errorId = `${field.name}-error`
                    const invalid = field.state.meta.errors.length > 0
                    return (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={field.name} className="form-label">
                          {t.postEditor.descLabel}
                        </Label>
                        <Textarea
                          id={field.name}
                          value={field.state.value}
                          onChange={(event) => {
                            field.handleChange(event.target.value)
                            markDirty()
                          }}
                          onBlur={field.handleBlur}
                          rows={4}
                          placeholder={t.postEditor.descPlaceholder}
                          aria-invalid={invalid}
                          aria-describedby={invalid ? errorId : undefined}
                          className="resize-none"
                        />
                        <FieldError errors={field.state.meta.errors} id={errorId} />
                      </div>
                    )
                  }}
                </form.Field>

                <form.Field name="coverImage">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={field.name} className="form-label">
                        {t.editing.coverImageLabel}
                      </Label>
                      <Input
                        id={field.name}
                        type="url"
                        value={field.state.value}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          markDirty()
                        }}
                        placeholder={t.editing.coverImagePlaceholder}
                        className="font-mono"
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="tags">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={field.name} className="form-label">
                        {t.editing.tagsLabel}
                      </Label>
                      <Input
                        id={field.name}
                        value={tagsText}
                        onChange={(event) => {
                          setTagsText(event.target.value)
                          field.handleChange(
                            event.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean),
                          )
                          markDirty()
                        }}
                        placeholder={t.editing.tagsPlaceholder}
                        aria-describedby="tags-hint"
                        className="font-mono"
                      />
                      <p id="tags-hint" className="font-mono text-xs text-muted-foreground">
                        {t.editing.tagsHint}
                      </p>
                    </div>
                  )}
                </form.Field>
              </PostEditorAdditionalSettings>
            </div>
          </div>

          <PostEditorActions
            draftLabel={draftTimeLabel ? t.action.draftSaved(draftTimeLabel) : t.action.draftSave}
            submitLabel={
              isPending ? t.action.saving : isEditMode ? t.action.done : t.action.publish
            }
            draftDisabled={
              draftWorkflow.draftDecision.status === "checking" ||
              draftWorkflow.draftDecision.status === "ready" ||
              draftWorkflow.draftDecision.status === "corrupt" ||
              documentLoadFailed
            }
            submitDisabled={submitDisabled}
            onSaveDraft={draftWorkflow.saveManually}
            onCancel={draftWorkflow.requestExit}
          />
        </fieldset>
      </form>

      <PostEditorDraftDialogs
        draftDecision={draftWorkflow.draftDecision}
        exitDialogOpen={draftWorkflow.exitDialogOpen}
        onDiscardPendingDraft={draftWorkflow.discardPendingDraft}
        onRestoreDraft={draftWorkflow.restoreDraft}
        onCloseExit={draftWorkflow.closeExitDialog}
        onDiscardAndExit={draftWorkflow.discardAndExit}
        onKeepDraftAndExit={draftWorkflow.keepDraftAndExit}
      />
    </>
  )
}
