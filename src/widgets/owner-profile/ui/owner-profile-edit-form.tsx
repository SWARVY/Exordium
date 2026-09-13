import { OwnerProfileFormSchema, type OwnerProfile } from "@entities/owner"
import { useUpdateProfile } from "@features/update-profile"
import { removeStagedAvatar, type StagedAvatar } from "@features/update-profile/api/avatar-storage"
import { useT } from "@shared/i18n"
import { fieldErrorMessage } from "@shared/lib/field-error"
import { Button } from "@shared/ui/components/button"
import { FieldError } from "@shared/ui/components/field-error"
import { Input } from "@shared/ui/components/input"
import { Label } from "@shared/ui/components/label"
import { Textarea } from "@shared/ui/components/textarea"
import { useForm } from "@tanstack/react-form"
import { PlusIcon } from "lucide-react"
import { useRef, useState } from "react"

import { AvatarField } from "./avatar-field"
import { SkillOrderField } from "./skill-order-field"

interface OwnerProfileEditFormProps {
  profile: OwnerProfile
  onCancel: () => void
  onSuccess: () => void
}

export function OwnerProfileEditForm({ profile, onCancel, onSuccess }: OwnerProfileEditFormProps) {
  const {
    mutate: updateProfile,
    isPending,
    isError: isSaveError,
    reset: resetSaveError,
  } = useUpdateProfile()
  const t = useT()
  const formRef = useRef<HTMLFormElement>(null)
  const [skillInput, setSkillInput] = useState("")
  const [stagedAvatar, setStagedAvatar] = useState<StagedAvatar | null>(null)
  const [isAvatarBusy, setIsAvatarBusy] = useState(false)
  const [cancelError, setCancelError] = useState(false)

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
      if (isAvatarBusy || isPending) return
      resetSaveError()
      updateProfile(value as Parameters<typeof updateProfile>[0], {
        onSuccess: () => {
          setStagedAvatar(null)
          onSuccess()
        },
      })
    },
  })

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    const current = form.getFieldValue("skills")
    if (!current.includes(trimmed)) {
      form.setFieldValue("skills", [...current, trimmed])
    }
    setSkillInput("")
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addSkill()
    }
  }

  async function handleCancel() {
    if (isAvatarBusy) return
    setCancelError(false)
    if (stagedAvatar) {
      setIsAvatarBusy(true)
      try {
        await removeStagedAvatar(stagedAvatar.path)
      } catch {
        setCancelError(true)
        return
      } finally {
        setIsAvatarBusy(false)
      }
    }
    onCancel()
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit().then(() => {
          formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
        })
      }}
      aria-label={t.profile.editTitle}
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-2"
    >
      <h2 className="form-heading">{t.profile.editTitle}</h2>
      <fieldset className="grid min-w-0 gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-sm font-semibold">{t.profile.basicInfo}</legend>
        <div className="min-w-0 sm:row-span-2">
          <form.Subscribe selector={(state) => state.values.avatarUrl}>
            {(avatarUrl) => (
              <AvatarField
                value={avatarUrl}
                stagedAvatar={stagedAvatar}
                disabled={isPending}
                onBusyChange={setIsAvatarBusy}
                onChange={(avatar) => {
                  setStagedAvatar(avatar)
                  setCancelError(false)
                  form.setFieldValue("avatarUrl", avatar.url)
                }}
              />
            )}
          </form.Subscribe>
        </div>

        {/* ── 이름 ── */}
        <form.Field name="name">
          {(field) => {
            const errorId = `${field.name}-error`
            const invalid = Boolean(fieldErrorMessage(field.state.meta.errors))
            return (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="form-label">
                  {t.profile.name}
                </Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errorId : undefined}
                />
                <FieldError errors={field.state.meta.errors} id={errorId} />
              </div>
            )
          }}
        </form.Field>

        {/* ── 소개 ── */}
        <form.Field name="bio">
          {(field) => {
            const errorId = `${field.name}-error`
            const invalid = Boolean(fieldErrorMessage(field.state.meta.errors))
            return (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name} className="form-label">
                  {t.profile.bio}
                </Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errorId : undefined}
                  className="w-full resize-y leading-relaxed"
                />
                <FieldError errors={field.state.meta.errors} id={errorId} />
              </div>
            )
          }}
        </form.Field>
      </fieldset>

      {/* ── Skills 태그 ── */}
      <form.Field name="skills">
        {(field) => (
          <section
            aria-labelledby="profile-skills-heading"
            className="flex min-w-0 flex-col gap-3 border-t border-border pt-6"
          >
            <h3 id="profile-skills-heading" className="text-sm font-semibold">
              {t.profile.skills}
            </h3>
            <p id="profile-skills-hint" className="text-xs leading-relaxed text-muted-foreground">
              {t.profile.skillsHint}
            </p>

            <div className="flex gap-2">
              <Input
                aria-label={t.management.skillInputLabel}
                aria-describedby="profile-skills-hint"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder={t.profile.skillsPlaceholder}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSkill}
                disabled={!skillInput.trim()}
              >
                <PlusIcon className="size-3" />
                {t.action.add}
              </Button>
            </div>
            <SkillOrderField
              skills={field.state.value}
              onChange={(skills) => form.setFieldValue("skills", skills)}
            />
          </section>
        )}
      </form.Field>

      <fieldset className="grid min-w-0 gap-4 border-t border-border pt-6 sm:grid-cols-2">
        <legend className="pr-3 text-sm font-semibold">{t.profile.links}</legend>
        {(["githubUrl", "twitterUrl", "websiteUrl"] as const).map((fieldName) => (
          <form.Field key={fieldName} name={fieldName}>
            {(field) => {
              const errorId = `${field.name}-error`
              const invalid = Boolean(fieldErrorMessage(field.state.meta.errors))
              return (
                <div
                  className={
                    fieldName === "websiteUrl"
                      ? "flex min-w-0 flex-col gap-1.5 sm:col-span-2"
                      : "flex min-w-0 flex-col gap-1.5"
                  }
                >
                  <Label htmlFor={field.name} className="form-label">
                    {fieldName === "githubUrl"
                      ? t.profile.githubUrl
                      : fieldName === "twitterUrl"
                        ? t.profile.twitterUrl
                        : t.profile.websiteUrl}
                  </Label>
                  <Input
                    id={field.name}
                    inputMode="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t.profile.urlPlaceholder}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? errorId : undefined}
                  />
                  <FieldError errors={field.state.meta.errors} id={errorId} />
                </div>
              )
            }}
          </form.Field>
        ))}
      </fieldset>

      {isSaveError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-destructive bg-card p-3">
          <p role="alert" className="text-sm font-medium text-destructive">
            {t.management.profileSaveFailed}
          </p>
          <button
            type="submit"
            disabled={isAvatarBusy || isPending}
            className="min-h-11 px-2 font-mono text-sm font-bold text-foreground underline decoration-2 underline-offset-4 hover:text-primary-ink"
          >
            {t.action.retry}
          </button>
        </div>
      ) : null}

      {cancelError ? (
        <p
          role="alert"
          className="rounded-xs border border-destructive bg-card p-3 text-sm text-destructive"
        >
          {t.management.avatarCleanupFailed}
        </p>
      ) : null}

      {/* ── 버튼 ── */}
      <div className="flex justify-end gap-2 border-t border-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleCancel()}
          disabled={isAvatarBusy || isPending}
        >
          {t.action.cancel}
        </Button>
        <Button type="submit" disabled={isPending || isAvatarBusy}>
          {isPending ? t.action.saving : t.action.save}
        </Button>
      </div>
    </form>
  )
}
