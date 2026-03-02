import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { OwnerProfileFormSchema, type OwnerProfile } from "@entities/owner"
import { useUpdateProfile } from "@features/update-profile"
import { supabase } from "@shared/api/supabase-client"
import { useT } from "@shared/i18n"
import { Input } from "@shared/ui/components/input"
import { Label } from "@shared/ui/components/label"
import { useForm } from "@tanstack/react-form"
import { GripIcon, ImageIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"

function SortableSkillTag({
  skill,
  onRemove,
  removeLabel,
}: {
  skill: string
  onRemove: () => void
  removeLabel: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: skill,
  })

  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      className="flex cursor-grab items-center gap-1 rounded-full border border-primary px-2.5 py-0.5 font-mono text-xs text-primary active:cursor-grabbing"
    >
      <GripIcon className="size-2.5 opacity-40" />
      {skill}
      <button
        type="button"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        className="ml-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label={removeLabel}
      >
        <XIcon className="size-2.5" />
      </button>
    </span>
  )
}

interface OwnerProfileEditFormProps {
  profile: OwnerProfile
  onCancel: () => void
  onSuccess: () => void
}

export function OwnerProfileEditForm({ profile, onCancel, onSuccess }: OwnerProfileEditFormProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const t = useT()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [activeSkill, setActiveSkill] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const form = useForm({
    formId: "owner-profile-edit",
    defaultValues: {
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl ?? null,
      githubUrl: profile.githubUrl ?? "",
      twitterUrl: profile.twitterUrl ?? "",
      websiteUrl: profile.websiteUrl ?? "",
      skills: profile.skills ?? [],
    },
    validators: { onSubmit: OwnerProfileFormSchema },
    onSubmit: ({ value }) => {
      updateProfile(value as Parameters<typeof updateProfile>[0], { onSuccess })
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const path = `avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      // 캐시 버스팅
      form.setFieldValue("avatarUrl", `${data.publicUrl}?t=${Date.now()}`)
    } catch (err) {
      console.error("Avatar upload failed:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    const current = form.getFieldValue("skills")
    if (!current.includes(trimmed)) {
      form.setFieldValue("skills", [...current, trimmed])
    }
    setSkillInput("")
  }

  const removeSkill = (skill: string) => {
    const current = form.getFieldValue("skills")
    form.setFieldValue(
      "skills",
      current.filter((s) => s !== skill),
    )
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-6 py-6"
    >
      {/* ── 아바타 업로드 ── */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {t.profile.avatar}
        </span>
        <div className="flex items-center gap-4">
          {/* 미리보기 */}
          <form.Subscribe selector={(s) => s.values.avatarUrl}>
            {(avatarUrl) =>
              avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={t.profile.avatarAlt}
                  className="clip-chamfer size-20 object-cover"
                />
              ) : (
                <div className="clip-chamfer flex size-20 items-center justify-center bg-muted text-muted-foreground">
                  <ImageIcon className="size-6" />
                </div>
              )
            }
          </form.Subscribe>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <UploadIcon className="size-3" />
              {isUploading ? t.action.uploading : t.action.upload}
            </button>
            <p className="font-mono text-[10px] text-muted-foreground/60">{t.profile.avatarHint}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      <div className="border-t border-dashed border-border" />

      {/* ── 이름 ── */}
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={field.name}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
            >
              {t.profile.name}
            </Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="rounded-sm border-border bg-card focus-visible:border-primary focus-visible:ring-primary/20"
            />
            {field.state.meta.errors[0] && (
              <p className="font-mono text-[10px] text-destructive">
                {String(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* ── 소개 ── */}
      <form.Field name="bio">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor={field.name}
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
            >
              {t.profile.bio}
            </Label>
            <textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-sm border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
            />
            {field.state.meta.errors[0] && (
              <p className="font-mono text-[10px] text-destructive">
                {String(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* ── Skills 태그 ── */}
      <form.Field name="skills">
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.profile.skills}
            </Label>
            {/* 태그 목록 */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setActiveSkill(String(e.active.id))}
              onDragEnd={(e: DragEndEvent) => {
                setActiveSkill(null)
                const { active, over } = e
                if (!over || active.id === over.id) return
                const skills = field.state.value
                const oldIdx = skills.indexOf(String(active.id))
                const newIdx = skills.indexOf(String(over.id))
                form.setFieldValue("skills", arrayMove(skills, oldIdx, newIdx))
              }}
              onDragCancel={() => setActiveSkill(null)}
            >
              <SortableContext items={field.state.value} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-wrap gap-1.5">
                  {field.state.value.map((skill) => (
                    <SortableSkillTag
                      key={skill}
                      skill={skill}
                      onRemove={() => removeSkill(skill)}
                      removeLabel={t.profile.removeSkill(skill)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeSkill && (
                  <span className="flex cursor-grabbing items-center gap-1 rounded-full border border-primary bg-card px-2.5 py-0.5 font-mono text-xs text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30">
                    <GripIcon className="size-2.5 opacity-40" />
                    {activeSkill}
                  </span>
                )}
              </DragOverlay>
            </DndContext>
            {/* 태그 입력 */}
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder={t.profile.skillsPlaceholder}
                className="rounded-sm border-border bg-card font-mono text-xs focus-visible:border-primary focus-visible:ring-primary/20"
              />
              <button
                type="button"
                onClick={addSkill}
                className="flex shrink-0 items-center gap-1 rounded-sm border border-border px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <PlusIcon className="size-3" />
                {t.action.add}
              </button>
            </div>
          </div>
        )}
      </form.Field>

      <div className="border-t border-dashed border-border" />

      {/* ── 링크 ── */}
      {(["githubUrl", "twitterUrl", "websiteUrl"] as const).map((fieldName) => (
        <form.Field key={fieldName} name={fieldName}>
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor={field.name}
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {fieldName === "githubUrl"
                  ? t.profile.githubUrl
                  : fieldName === "twitterUrl"
                    ? t.profile.twitterUrl
                    : t.profile.websiteUrl}
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t.profile.urlPlaceholder}
                className="rounded-sm border-border bg-card font-mono text-xs focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>
          )}
        </form.Field>
      ))}

      {/* ── 버튼 ── */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-border px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          {t.action.cancel}
        </button>
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="rounded-sm border border-primary/40 bg-primary/10 px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          {isPending ? t.action.saving : t.action.save}
        </button>
      </div>
    </form>
  )
}
