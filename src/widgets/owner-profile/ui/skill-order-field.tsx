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
  hasSortableData,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useT } from "@shared/i18n"
import { useCallback, useRef, useState } from "react"

import { SkillOrderItem } from "./skill-order-item"

import type { DragEndEvent, DragStartEvent, KeyboardCoordinateGetter } from "@dnd-kit/core"

interface SkillOrderFieldProps {
  skills: string[]
  onChange: (skills: string[]) => void
}

export function SkillOrderField({ skills, onChange }: SkillOrderFieldProps) {
  const t = useT()
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const keyboardTargetIndex = useRef<number | null>(null)
  const keyboardCoordinates = useCallback<KeyboardCoordinateGetter>((event, { context }) => {
    const direction =
      event.code === "ArrowLeft" || event.code === "ArrowUp"
        ? -1
        : event.code === "ArrowRight" || event.code === "ArrowDown"
          ? 1
          : 0
    const { active, collisionRect, droppableRects } = context

    if (!direction || !active || !collisionRect || !hasSortableData(active)) return

    const items = active.data.current.sortable.items
    const currentIndex = keyboardTargetIndex.current ?? active.data.current.sortable.index
    const targetIndex = currentIndex + direction
    const targetId = items[targetIndex]
    const targetRect = targetId === undefined ? undefined : droppableRects.get(targetId)

    if (!targetRect) return

    keyboardTargetIndex.current = targetIndex
    event.preventDefault()
    return {
      x: targetRect.left + (targetRect.width - collisionRect.width) / 2,
      y: targetRect.top + (targetRect.height - collisionRect.height) / 2,
    }
  }, [])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  )

  function moveSkill(from: number, to: number) {
    if (from < 0 || to < 0 || from >= skills.length || to >= skills.length || from === to) return
    const next = arrayMove(skills, from, to)
    onChange(next)
    setStatus(t.management.skillMoved(next[to], to + 1, next.length))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveSkill(null)
    const targetIndex = keyboardTargetIndex.current
    keyboardTargetIndex.current = null
    const { active, over } = event

    if (event.activatorEvent.type === "keydown") {
      if (targetIndex !== null) moveSkill(skills.indexOf(String(active.id)), targetIndex)
      return
    }

    if (!over || active.id === over.id) return
    moveSkill(skills.indexOf(String(active.id)), skills.indexOf(String(over.id)))
  }

  function handleDragCancel() {
    setActiveSkill(null)
    keyboardTargetIndex.current = null
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event: DragStartEvent) => {
          keyboardTargetIndex.current = null
          setActiveSkill(String(event.active.id))
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={skills} strategy={verticalListSortingStrategy}>
          <div role="list" aria-label={t.profile.skills} className="flex flex-col gap-2">
            {skills.map((skill, index) => (
              <SkillOrderItem
                key={skill}
                skill={skill}
                index={index}
                count={skills.length}
                onMove={moveSkill}
                onRemove={() => onChange(skills.filter((item) => item !== skill))}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeSkill ? (
            <span className="rounded-xs border border-input bg-card px-3 py-2 font-mono text-sm font-medium text-foreground">
              {activeSkill}
            </span>
          ) : null}
        </DragOverlay>
      </DndContext>
      <p
        aria-live="polite"
        className={status ? "text-xs leading-relaxed text-muted-foreground" : "sr-only"}
      >
        {status}
      </p>
    </>
  )
}
