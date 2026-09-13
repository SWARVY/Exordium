import {
  AVATAR_ACCEPT,
  MAX_AVATAR_BYTES,
  AvatarValidationError,
  removeStagedAvatar,
  stageAvatar,
  type StagedAvatar,
} from "@features/update-profile/api/avatar-storage"
import { useT } from "@shared/i18n"
import { cn } from "@shared/lib/utils"
import { Button } from "@shared/ui/components/button"
import { Label } from "@shared/ui/components/label"
import { ImageIcon, UploadIcon } from "lucide-react"
import { useRef, useState } from "react"
import { useDropzone } from "react-dropzone"

interface AvatarFieldProps {
  value: string | null
  stagedAvatar: StagedAvatar | null
  disabled?: boolean
  onChange: (avatar: StagedAvatar) => void
  onBusyChange: (busy: boolean) => void
}

export function AvatarField({
  value,
  stagedAvatar,
  disabled = false,
  onChange,
  onBusyChange,
}: AvatarFieldProps) {
  const t = useT()
  const busyRef = useRef(false)
  const [lastFile, setLastFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  async function upload(file: File) {
    if (disabled || busyRef.current) return
    busyRef.current = true
    setLastFile(file)
    setIsUploading(true)
    setIsReady(false)
    setError(null)
    onBusyChange(true)

    try {
      const nextAvatar = await stageAvatar(file)
      if (stagedAvatar && stagedAvatar.path !== nextAvatar.path) {
        try {
          await removeStagedAvatar(stagedAvatar.path)
        } catch (cleanupError) {
          await removeStagedAvatar(nextAvatar.path).catch(() => null)
          throw cleanupError
        }
      }
      onChange(nextAvatar)
      setIsReady(true)
    } catch (uploadError) {
      if (uploadError instanceof AvatarValidationError) {
        setError(
          uploadError.code === "too-large"
            ? t.management.avatarTooLarge
            : t.management.avatarInvalidType,
        )
      } else {
        setError(t.management.avatarUploadFailed)
      }
    } finally {
      setIsUploading(false)
      onBusyChange(false)
      busyRef.current = false
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: AVATAR_ACCEPT,
    maxSize: MAX_AVATAR_BYTES,
    multiple: false,
    disabled: disabled || isUploading,
    onDrop: (files, rejections) => {
      if (disabled || busyRef.current) return
      if (rejections.length) {
        setLastFile(null)
        setIsReady(false)
        const codes = rejections.flatMap(({ errors }) => errors.map(({ code }) => code))
        setError(
          codes.includes("too-many-files")
            ? t.management.avatarOneFile
            : codes.includes("file-too-large")
              ? t.management.avatarTooLarge
              : t.management.avatarInvalidType,
        )
        return
      }
      if (files[0]) void upload(files[0])
    },
  })

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor="profile-avatar" className="form-label">
        {t.profile.avatar}
      </Label>
      <div
        {...getRootProps({
          role: "button",
          "aria-label": t.profile.avatarDropLabel,
          "aria-describedby": "profile-avatar-hint",
          "aria-disabled": disabled || isUploading,
          "aria-busy": isUploading,
          className: cn(
            "flex min-h-28 min-w-0 items-center gap-3 rounded-xs border border-dashed border-input bg-card p-3 text-left transition-colors hover:border-primary-ink hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink sm:gap-4 sm:p-4",
            isDragActive && "border-primary-ink bg-accent",
            isDragReject && "border-destructive",
            (disabled || isUploading) && "cursor-wait opacity-60",
          ),
        })}
      >
        <input
          {...getInputProps({
            id: "profile-avatar",
            "aria-label": t.profile.avatar,
            disabled: disabled || isUploading,
          })}
        />
        {value ? (
          <img
            src={value}
            alt={t.profile.avatarAlt}
            className="size-12 shrink-0 sm:size-16 rounded-xs object-cover"
          />
        ) : (
          <span className="flex size-12 shrink-0 sm:size-16 items-center justify-center rounded-xs border border-border bg-muted text-muted-foreground">
            <ImageIcon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 space-y-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UploadIcon className="size-4 shrink-0 text-primary-ink" aria-hidden="true" />
            {isUploading ? t.action.uploading : t.action.upload}
          </span>
          <p className="break-keep text-xs leading-relaxed text-muted-foreground">
            {isDragActive ? t.profile.avatarDropActive : t.profile.avatarDropHint}
          </p>
          <p id="profile-avatar-hint" className="break-keep text-xs text-muted-foreground">
            {t.profile.avatarHint}
          </p>
        </div>
      </div>
      {isUploading ? (
        <p role="status" className="break-keep text-xs leading-relaxed text-muted-foreground">
          {t.management.avatarUploading}
        </p>
      ) : error ? (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-xs leading-relaxed text-destructive">
            {error}
          </p>
          {lastFile && error === t.management.avatarUploadFailed ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => void upload(lastFile)}
              disabled={disabled}
            >
              {t.action.retry}
            </Button>
          ) : null}
        </div>
      ) : isReady ? (
        <p role="status" className="text-xs leading-relaxed text-primary-ink">
          {t.management.avatarReady}
        </p>
      ) : null}
    </div>
  )
}
