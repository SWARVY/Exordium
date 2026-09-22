import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useT } from "@shared/i18n"
import { ArrowUpIcon, ArrowDownIcon, GripVerticalIcon, XIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef } from "react"

interface SkillOrderItemProps {
  skill: string
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: (skill: string) => void
}

export function SkillOrderItem({ skill, index, count, onMove, onRemove }: SkillOrderItemProps) {
  const t = useT()
  const pendingSensorKeys = useRef(Promise.resolve())
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: skill,
  })
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const isPreviousKey = event.key === "ArrowLeft" || event.key === "ArrowUp"
      const isNextKey = event.key === "ArrowRight" || event.key === "ArrowDown"
      const isDragLifecycleKey =
        event.key === " " || event.key === "Enter" || event.key === "Escape"

      if (isDragging && (isPreviousKey || isNextKey || isDragLifecycleKey)) {
        const ownerDocument = event.currentTarget.ownerDocument
        const eventWindow = ownerDocument.defaultView
        const keyboardEvent = {
          key: event.key,
          code: event.code,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          repeat: event.repeat,
        }
        event.preventDefault()
        event.stopPropagation()
        // React and the sensor share document; only the queued event should reach the sensor.
        event.nativeEvent.stopImmediatePropagation()
        // The sensor attaches on the next task; preserve rapid key order until it is ready.
        if (eventWindow) {
          pendingSensorKeys.current = pendingSensorKeys.current.then(
            () =>
              new Promise<void>((resolve) => {
                eventWindow.setTimeout(() => {
                  if (mounted.current) {
                    ownerDocument.dispatchEvent(
                      new eventWindow.KeyboardEvent("keydown", {
                        ...keyboardEvent,
                        bubbles: true,
                        cancelable: true,
                      }),
                    )
                  }
                  eventWindow.setTimeout(resolve, 0)
                }, 0)
              }),
          )
        }
        return
      }

      if (isPreviousKey) {
        event.preventDefault()
        event.nativeEvent.stopImmediatePropagation()
        onMove(index, index - 1)
        return
      }
      if (isNextKey) {
        event.preventDefault()
        event.nativeEvent.stopImmediatePropagation()
        onMove(index, index + 1)
        return
      }
      listeners?.onKeyDown?.(event)
    },
    [index, isDragging, listeners, onMove],
  )
  const handleMoveUp = useCallback(() => onMove(index, index - 1), [index, onMove])
  const handleMoveDown = useCallback(() => onMove(index, index + 1), [index, onMove])
  const handleRemove = useCallback(() => onRemove(skill), [onRemove, skill])
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : 1,
    }),
    [isDragging, transform, transition],
  )

  const controlClass =
    "flex min-h-11 w-11 shrink-0 items-center justify-center  text-muted-foreground transition-colors hover:bg-muted hover:text-primary-ink disabled:cursor-not-allowed disabled:opacity-30"

  return (
    <div
      role="listitem"
      ref={setNodeRef}
      style={style}
      className="flex min-h-11 w-full min-w-0 max-w-full items-stretch rounded-xs border border-border bg-card text-xs font-medium sm:text-sm text-foreground"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
        onKeyDown={handleKeyDown}
        className="flex min-h-11 min-w-0 flex-1 cursor-grab items-center gap-2 px-2 text-left touch-none active:cursor-grabbing"
        aria-label={t.management.skillDrag(skill)}
      >
        <GripVerticalIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span
          className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{skill}</span>
      </button>
      <button
        type="button"
        onClick={handleMoveUp}
        disabled={index === 0}
        className={controlClass}
        title={t.management.skillMoveUp(skill)}
        aria-label={t.management.skillMoveUp(skill)}
      >
        <ArrowUpIcon className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={handleMoveDown}
        disabled={index === count - 1}
        className={controlClass}
        title={t.management.skillMoveDown(skill)}
        aria-label={t.management.skillMoveDown(skill)}
      >
        <ArrowDownIcon className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={handleRemove}
        className={controlClass}
        title={t.profile.removeSkill(skill)}
        aria-label={t.profile.removeSkill(skill)}
      >
        <XIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
