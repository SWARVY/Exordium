import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { openSourceQueryOptions, type OpenSource } from "@entities/open-source"
import { OpenSourceFormDialog, useReorderOpenSource } from "@features/manage-open-source"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { useSuspenseQuery } from "@suspensive/react-query-5"
import { useState } from "react"

import { OpenSourceCard, OpenSourceCardContent } from "./open-source-card"
import { OpenSourceSkeleton } from "./open-source-skeleton"

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"

function OpenSourceListContent() {
  const { data } = useSuspenseQuery(openSourceQueryOptions.list())
  const isOwner = useIsOwner()
  const t = useT()
  const {
    mutate: reorder,
    isPending: isReordering,
    isError: isReorderError,
    isSuccess: isReorderSuccess,
    variables: lastReorder,
  } = useReorderOpenSource()
  const [activeItem, setActiveItem] = useState<OpenSource | null>(null)
  const [moveStatus, setMoveStatus] = useState("")

  const items = [...data].sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    const found = items.find((i) => i.id === event.active.id)
    setActiveItem(found ?? null)
  }

  function moveItem(oldIndex: number, newIndex: number) {
    if (
      isReordering ||
      oldIndex < 0 ||
      newIndex < 0 ||
      oldIndex >= items.length ||
      newIndex >= items.length ||
      oldIndex === newIndex
    ) {
      return
    }
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      order: idx,
    }))

    setMoveStatus(t.management.projectMoved(reordered[newIndex].name, newIndex + 1, items.length))
    reorder(reordered.map(({ id, order }) => ({ id, order })))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null)

    const { active, over } = event
    if (!over || active.id === over.id) return
    moveItem(
      items.findIndex((item) => item.id === active.id),
      items.findIndex((item) => item.id === over.id),
    )
  }

  function handleDragCancel() {
    setActiveItem(null)
  }

  return (
    <section aria-label={t.nav.projects} aria-busy={isReordering}>
      {/* List header */}
      <div className="mb-8 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold uppercase tracking-widest text-primary-ink">
          — {items.length} project{items.length !== 1 ? "s" : ""}
        </span>
        {isOwner && <OpenSourceFormDialog mode="create" />}
      </div>

      {items.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border px-8 py-24 text-center">
          <p className="font-mono text-sm font-medium text-foreground">{t.project.noProjectsYet}</p>
          <p className="mt-2 font-mono text-sm text-muted-foreground">{t.project.noProjectsDesc}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <OpenSourceCard
                  key={item.id}
                  item={item}
                  isDndEnabled={isOwner && !isReordering}
                  isReordering={isReordering}
                  onMoveUp={() => moveItem(items.indexOf(item), items.indexOf(item) - 1)}
                  onMoveDown={() => moveItem(items.indexOf(item), items.indexOf(item) + 1)}
                  isFirst={items.indexOf(item) === 0}
                  isLast={items.indexOf(item) === items.length - 1}
                />
              ))}
            </div>
          </SortableContext>

          {/* 드래그 중인 카드를 커서를 따라 떠다니는 오버레이로 렌더링 */}
          <DragOverlay dropAnimation={null}>
            {activeItem && (
              <div className="rotate-1 scale-105 opacity-95 shadow-2xl shadow-primary/20">
                <OpenSourceCardContent
                  item={activeItem}
                  isDndEnabled={false}
                  showOwnerControls={false}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {isOwner ? (
        <div className="mt-5 min-h-11 border-t-2 border-dashed border-border pt-3">
          {isReorderError ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="alert" className="text-sm font-medium text-destructive">
                {t.management.projectOrderFailed}
              </p>
              <button
                type="button"
                onClick={() => lastReorder && reorder(lastReorder)}
                disabled={!lastReorder}
                className="min-h-11 px-2 font-mono text-sm font-bold text-foreground underline decoration-2 underline-offset-4 hover:text-primary-ink disabled:opacity-40"
              >
                {t.action.retry}
              </button>
            </div>
          ) : (
            <p aria-live="polite" role="status" className="text-sm text-muted-foreground">
              {isReordering
                ? t.management.projectOrderSaving
                : isReorderSuccess
                  ? t.management.projectOrderSaved
                  : moveStatus}
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}

export function OpenSourceList() {
  return (
    <AsyncBoundary fallback={<OpenSourceSkeleton />}>
      <OpenSourceListContent />
    </AsyncBoundary>
  )
}
