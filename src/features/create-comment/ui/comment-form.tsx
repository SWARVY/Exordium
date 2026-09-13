import { Popover } from "@base-ui/react/popover"
import { CommentContentSchema } from "@entities/comment"
import { useT } from "@shared/i18n"
import { fieldErrorMessage } from "@shared/lib/field-error"
import { Button } from "@shared/ui/components/button"
import { FieldError } from "@shared/ui/components/field-error"
import { useForm } from "@tanstack/react-form"
import { EmojiPicker } from "frimousse"
import { SmileIcon } from "lucide-react"
import { useEffect, useRef } from "react"

import { useCreateComment } from "../api/create-comment-mutation"

interface CommentFormProps {
  postId: string
  parentId?: string
  onSuccess?: () => void
  placeholder?: string
  compact?: boolean
}

const MAX_LENGTH = 1000

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  placeholder,
  compact = false,
}: CommentFormProps) {
  const {
    mutate: createComment,
    isPending,
    error: createError,
    reset: resetCreate,
  } = useCreateComment(postId)
  const t = useT()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputId = parentId ? `comment-reply-${parentId}-content` : `comment-${postId}-content`
  const errorId = parentId ? `comment-reply-${parentId}-error` : `comment-${postId}-error`

  useEffect(() => {
    if (createError) textareaRef.current?.focus()
  }, [createError])

  const form = useForm({
    formId: parentId ? `comment-reply-${parentId}` : `comment-${postId}`,
    defaultValues: { content: "" },
    validators: { onSubmit: CommentContentSchema },
    onSubmit: ({ value }) => {
      createComment(
        { ...value, parentId },
        {
          onSuccess: () => {
            form.reset()
            onSuccess?.()
          },
        },
      )
    },
  })

  function insertEmoji(native: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const current = form.getFieldValue("content")
    const next = current.slice(0, start) + native + current.slice(end)
    form.setFieldValue("content", next)
    // 커서를 이모지 뒤로 이동
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + native.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <form.Field name="content">
      {(field) => (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-2"
        >
          {/* Textarea + toolbar */}
          <div className="rounded-xs border border-input bg-card transition-[border-color] focus-within:border-primary-ink">
            <textarea
              ref={textareaRef}
              id={inputId}
              value={field.state.value}
              onChange={(e) => {
                if (createError) resetCreate()
                field.handleChange(e.target.value)
              }}
              placeholder={placeholder ?? t.comment.placeholder}
              rows={compact ? 2 : 3}
              maxLength={MAX_LENGTH}
              className="block w-full resize-none bg-transparent p-3 text-base leading-relaxed text-foreground outline-none focus-visible:outline-none placeholder:text-sm placeholder:text-muted-foreground sm:text-sm"
              aria-label={t.comment.label}
              aria-describedby={
                fieldErrorMessage([...field.state.meta.errors, createError]) ? errorId : undefined
              }
              aria-invalid={
                fieldErrorMessage([...field.state.meta.errors, createError]) ? true : undefined
              }
            />

            {/* Toolbar row */}
            <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1">
              <div className="flex items-center gap-1">
                {/* 이모지 피커 — Base UI Popover */}
                <Popover.Root>
                  <Popover.Trigger
                    aria-label={t.comment.addEmoji}
                    className="flex size-11 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary-ink data-[popup-open]:bg-primary/10 data-[popup-open]:text-primary-ink"
                  >
                    <SmileIcon className="size-4" />
                  </Popover.Trigger>

                  <Popover.Portal>
                    <Popover.Positioner side="top" align="start" sideOffset={8}>
                      <Popover.Popup className="z-50 overflow-hidden rounded-sm border border-border bg-card shadow-xl outline-none">
                        <EmojiPicker.Root
                          onEmojiSelect={({ emoji }) => insertEmoji(emoji)}
                          locale="ko"
                          columns={9}
                          className="flex w-72 flex-col"
                        >
                          <div className="border-b border-border px-2 py-2">
                            <EmojiPicker.Search
                              placeholder={t.comment.emojiSearch}
                              className="w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
                            />
                          </div>
                          <EmojiPicker.Viewport className="h-60">
                            <EmojiPicker.Loading className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                              {t.comment.emojiLoading}
                            </EmojiPicker.Loading>
                            <EmojiPicker.Empty className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                              {t.comment.emojiEmpty}
                            </EmojiPicker.Empty>
                            <EmojiPicker.List />
                          </EmojiPicker.Viewport>
                        </EmojiPicker.Root>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              <div className="flex items-center gap-2">
                {/* 글자 수 */}
                <span
                  className={`font-mono text-xs tabular-nums ${
                    field.state.value.length > MAX_LENGTH * 0.9
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {field.state.value.length}/{MAX_LENGTH}
                </span>

                {/* 등록 버튼 */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || field.state.value.trim().length === 0}
                >
                  {isPending ? t.action.submitting : compact ? t.action.reply : t.action.submit}
                </Button>
              </div>
            </div>
          </div>

          <FieldError errors={[...field.state.meta.errors, createError]} id={errorId} />
        </form>
      )}
    </form.Field>
  )
}
