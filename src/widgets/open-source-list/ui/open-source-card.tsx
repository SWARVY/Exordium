import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { OpenSourceFormDialog, useDeleteOpenSource } from "@features/manage-open-source"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { ConfirmDialog } from "@shared/ui/components/confirm-dialog"
import { ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon, GripVerticalIcon } from "lucide-react"

import type { OpenSource } from "@entities/open-source"

interface OpenSourceCardProps {
  item: OpenSource
  isDndEnabled?: boolean
  isReordering?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
}

/** 순수 카드 UI (Overlay와 Sortable 양쪽에서 공유) */
export function OpenSourceCardContent({
  item,
  isDndEnabled = false,
  isReordering = false,
  showOwnerControls = true,
  dragHandleProps,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: {
  item: OpenSource
  isDndEnabled?: boolean
  isReordering?: boolean
  showOwnerControls?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  const isOwner = useIsOwner()
  const t = useT()
  const { mutate: deleteItem, isPending } = useDeleteOpenSource()

  return (
    <article className="group flex h-full flex-col gap-4 rounded-sm border border-border bg-card p-6 transition-colors duration-200 hover:border-primary">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {item.language && (
            <span className="mb-2 inline-block rounded-sm border border-border px-2.5 py-1 type-meta font-mono font-medium uppercase tracking-wider text-muted-foreground">
              {item.language}
            </span>
          )}
          <h2 className="type-card-title text-foreground transition-colors group-hover:text-primary-ink">
            {item.name}
          </h2>
        </div>
        <div className="flex max-w-[65%] shrink-0 flex-wrap items-center justify-end gap-1">
          {isDndEnabled && (
            <button
              {...dragHandleProps}
              aria-label={t.management.projectDrag(item.name)}
              className="flex size-11 cursor-grab items-center justify-center rounded-sm border-2 border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary-ink active:cursor-grabbing"
            >
              <GripVerticalIcon className="size-4" />
            </button>
          )}
          {isOwner && showOwnerControls && (
            <>
              {onMoveUp ? (
                <button
                  type="button"
                  onClick={onMoveUp}
                  disabled={isFirst || isReordering}
                  aria-label={t.management.projectMoveUp(item.name)}
                  className="flex size-11 items-center justify-center rounded-sm border-2 border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary-ink disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUpIcon className="size-4" />
                </button>
              ) : null}
              {onMoveDown ? (
                <button
                  type="button"
                  onClick={onMoveDown}
                  disabled={isLast || isReordering}
                  aria-label={t.management.projectMoveDown(item.name)}
                  className="flex size-11 items-center justify-center rounded-sm border-2 border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary-ink disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDownIcon className="size-4" />
                </button>
              ) : null}
              <OpenSourceFormDialog mode="edit" item={item} />
              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    disabled={isPending}
                    aria-label={t.aria.deleteItem(item.name)}
                    className="min-h-11 rounded-sm border-2 border-border px-3 py-1.5 font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
                  >
                    {isPending ? t.action.deleting : t.action.delete}
                  </button>
                }
                title={t.management.projectDeleteTitle(item.name)}
                description={t.management.projectDeleteConfirm}
                confirmLabel={t.action.delete}
                variant="destructive"
                onConfirm={() => deleteItem(item.id)}
                isPending={isPending}
              />
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="type-summary flex-1 text-muted-foreground">{item.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-end">
        <a
          href={item.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.aria.repoLink(item.name)}
          className="flex min-h-11 items-center gap-1 font-mono text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary-ink"
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
export function OpenSourceCard({
  item,
  isDndEnabled = false,
  isReordering = false,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: OpenSourceCardProps) {
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
        <div
          className="h-full rounded-sm border border-dashed border-border bg-muted/30"
          style={{ minHeight: 160 }}
        />
      ) : (
        <OpenSourceCardContent
          item={item}
          isDndEnabled={isDndEnabled}
          isReordering={isReordering}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          isFirst={isFirst}
          isLast={isLast}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      )}
    </div>
  )
}
