import { openSourceKeys, openSourceQueryOptions, type OpenSource } from "@entities/open-source"
import { OpenSourceFormDialog, useReorderOpenSource } from "@features/manage-open-source"
import { useT } from "@shared/i18n"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable"
import { AsyncBoundary } from "@shared/ui/components/async-boundary"
import { useSuspenseQuery } from "@suspensive/react-query-5"
import { useState } from "react"

import { OpenSourceCard, OpenSourceCardContent } from "./open-source-card"
import { OpenSourceSkeleton } from "./open-source-skeleton"

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"

function OpenSourceListContent() {
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(openSourceQueryOptions.list())
  const isOwner = useIsOwner()
  const t = useT()
  const { mutate: reorder } = useReorderOpenSource()
  const [activeItem, setActiveItem] = useState<OpenSource | null>(null)

  const items = [...data].sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    const found = items.find((i) => i.id === event.active.id)
    setActiveItem(found ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      order: idx,
    }))

    queryClient.setQueryData<OpenSource[]>(openSourceKeys.lists(), reordered)
    reorder(reordered.map(({ id, order }) => ({ id, order })))
  }

  function handleDragCancel() {
    setActiveItem(null)
  }

  return (
    <section aria-label={t.aria.projectLoading}>
      {/* List header */}
      <div className="mb-8 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          — {items.length} project{items.length !== 1 ? "s" : ""}
        </span>
        {isOwner && <OpenSourceFormDialog mode="create" />}
      </div>

      {items.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border px-8 py-24 text-center">
          <p className="font-mono text-sm font-medium text-foreground">{t.project.noProjectsYet}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {t.project.noProjectsDesc}
          </p>
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
                <OpenSourceCard key={item.id} item={item} isDndEnabled={isOwner} />
              ))}
            </div>
          </SortableContext>

          {/* 드래그 중인 카드를 커서를 따라 떠다니는 오버레이로 렌더링 */}
          <DragOverlay dropAnimation={null}>
            {activeItem && (
              <div className="rotate-1 scale-105 opacity-95 shadow-2xl shadow-primary/20">
                <OpenSourceCardContent item={activeItem} isDndEnabled={false} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
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
