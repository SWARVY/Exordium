import { CommentContentSchema } from "@entities/comment"
import { useT } from "@shared/i18n"
import { Popover } from "@base-ui/react/popover"
import { useForm } from "@tanstack/react-form"
import { EmojiPicker } from "frimousse"
import { SmileIcon } from "lucide-react"
import { useRef } from "react"

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
  const { mutate: createComment, isPending } = useCreateComment(postId)
  const t = useT()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
          <div className="rounded-sm border border-border bg-card transition-[border-color] focus-within:border-primary">
            <textarea
              ref={textareaRef}
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={placeholder ?? t.comment.placeholder}
              rows={compact ? 2 : 3}
              maxLength={MAX_LENGTH}
              className="w-full resize-none bg-transparent px-3 pb-2 pt-3 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
              aria-label={t.comment.label}
            />

            {/* Toolbar row */}
            <div className="flex items-center justify-between border-t border-border/60 px-2 py-1.5">
              <div className="flex items-center gap-1">
                {/* 이모지 피커 — Base UI Popover */}
                <Popover.Root>
                  <Popover.Trigger
                    aria-label={t.comment.addEmoji}
                    className="flex size-7 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:text-muted-foreground data-[popup-open]:bg-primary/10 data-[popup-open]:text-primary"
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
                              placeholder="검색..."
                              className="w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
                            />
                          </div>
                          <EmojiPicker.Viewport className="h-60">
                            <EmojiPicker.Loading className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                              로딩 중…
                            </EmojiPicker.Loading>
                            <EmojiPicker.Empty className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                              이모지를 찾을 수 없어요
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
                  className={`font-mono text-[10px] tabular-nums ${
                    field.state.value.length > MAX_LENGTH * 0.9
                      ? "text-destructive"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {field.state.value.length}/{MAX_LENGTH}
                </span>

                {/* 등록 버튼 */}
                <button
                  type="submit"
                  disabled={isPending || field.state.value.trim().length === 0}
                  className="rounded-sm bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {isPending ? t.action.submitting : compact ? t.action.reply : t.action.submit}
                </button>
              </div>
            </div>
          </div>

          {/* 유효성 에러 */}
          {field.state.meta.errors[0] && (
            <p className="font-mono text-[10px] text-destructive">
              {String(field.state.meta.errors[0])}
            </p>
          )}
        </form>
      )}
    </form.Field>
  )
}
