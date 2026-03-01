import { OpenSourceFormDialog, useDeleteOpenSource } from "@features/manage-open-source"
import { useT } from "@shared/i18n"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowUpRightIcon, GripVerticalIcon } from "lucide-react"

import type { OpenSource } from "@entities/open-source"

interface OpenSourceCardProps {
  item: OpenSource
  isDndEnabled?: boolean
  /** DragOverlay에서 렌더링할 때 true — sortable 훅 없이 순수 카드만 */
  isOverlay?: boolean
}

/** 순수 카드 UI (Overlay와 Sortable 양쪽에서 공유) */
export function OpenSourceCardContent({
  item,
  isDndEnabled = false,
  dragHandleProps,
}: {
  item: OpenSource
  isDndEnabled?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const isOwner = useIsOwner()
  const t = useT()
  const { mutate: deleteItem, isPending } = useDeleteOpenSource()

  return (
    <article className="group flex h-full flex-col gap-4 rounded-sm border border-border bg-card p-6 transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0_0_var(--color-primary)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {item.language && (
            <span className="mb-2 inline-block rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {item.language}
            </span>
          )}
          <h2 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {item.name}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isDndEnabled && (
            <button
              {...dragHandleProps}
              aria-label={t.project.dragHandle}
              className="flex size-7 cursor-grab items-center justify-center rounded-sm text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            >
              <GripVerticalIcon className="size-4" />
            </button>
          )}
          {isOwner && (
            <>
              <OpenSourceFormDialog mode="edit" item={item} />
              <button
                onClick={() => deleteItem(item.id)}
                disabled={isPending}
                aria-label={t.aria.deleteItem(item.name)}
                className="rounded-full border border-border px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                {t.action.delete}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-end">
        <a
          href={item.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.aria.repoLink(item.name)}
          className="flex items-center gap-1 font-mono text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {t.action.viewRepo}
          <ArrowUpRightIcon className="size-3 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </article>
  )
}

/** Sortable 래퍼 — 드래그 중이면 ghost placeholder만 보여줌 */
export function OpenSourceCard({ item, isDndEnabled = false }: OpenSourceCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isDndEnabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {isDragging ? (
        // 드래그 중인 자리는 ghost outline만 표시
        <div className="h-full rounded-sm border border-dashed border-border bg-muted/30" style={{ minHeight: 160 }} />
      ) : (
        <OpenSourceCardContent
          item={item}
          isDndEnabled={isDndEnabled}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      )}
    </div>
  )
}
