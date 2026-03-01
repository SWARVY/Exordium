import { CommentContentSchema } from "@entities/comment"
import { useT } from "@shared/i18n"
import { useForm } from "@tanstack/react-form"
import EmojiPicker from "@emoji-mart/react"
import emojiData from "@emoji-mart/data"
import { SmileIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

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
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // 외부 클릭 시 피커 닫기
  useEffect(() => {
    if (!showEmoji) return
    function handleClick(e: MouseEvent) {
      if (
        pickerRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      ) return
      setShowEmoji(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showEmoji])

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
            setShowEmoji(false)
            onSuccess?.()
          },
        },
      )
    },
  })

  function insertEmoji(emoji: { native: string }) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const current = form.getFieldValue("content")
    const next = current.slice(0, start) + emoji.native + current.slice(end)
    form.setFieldValue("content", next)
    // 커서를 이모지 뒤로 이동
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.native.length
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
          className="relative flex flex-col gap-2"
        >
          {/* Textarea + 이모지 피커 컨테이너 */}
          <div className="relative rounded-sm border border-border bg-card transition-[border-color] focus-within:border-primary">
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
                {/* 이모지 피커 토글 */}
                <button
                  ref={btnRef}
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  aria-label={t.comment.addEmoji}
                  className={`flex size-7 items-center justify-center rounded-sm transition-colors ${
                    showEmoji
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  }`}
                >
                  <SmileIcon className="size-4" />
                </button>
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

          {/* 이모지 피커 — absolute 오버레이 */}
          {showEmoji && (
            <div
              ref={pickerRef}
              className="absolute bottom-full left-0 z-50 mb-1"
            >
              <EmojiPicker
                data={emojiData}
                onEmojiSelect={insertEmoji}
                theme="auto"
                locale="ko"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
              />
            </div>
          )}

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
