import { useT } from "@shared/i18n"
import { AlertTriangleIcon, TrashIcon } from "lucide-react"
import { useState } from "react"

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog"

import type { ReactElement } from "react"

interface ConfirmDialogProps {
  /** 다이얼로그를 여는 트리거 요소 */
  trigger: ReactElement
  title: string
  description?: string
  /** 확인 버튼 레이블 (기본값: "확인") */
  confirmLabel?: string
  /** 취소 버튼 레이블 (기본값: "취소") */
  cancelLabel?: string
  /** 확인 버튼 variant. "destructive" = 빨간색 */
  variant?: "default" | "destructive"
  /** 확인 버튼 클릭 시 호출 */
  onConfirm: () => void
  /** pending 상태 (확인 버튼 비활성화) */
  isPending?: boolean
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  isPending = false,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const t = useT()
  const resolvedConfirmLabel = confirmLabel ?? t.form.confirm
  const resolvedCancelLabel = cancelLabel ?? t.form.cancel

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  const isDestructive = variant === "destructive"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      <DialogContent showCloseButton={false} className="max-w-xs sm:max-w-xs bg-card p-0">
        {/* Icon + header */}
        <div className="flex flex-col items-center gap-4 px-6 pb-2 pt-8 text-center">
          <div
            className={
              isDestructive
                ? "flex size-12 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10"
                : "flex size-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
            }
          >
            {isDestructive ? (
              <TrashIcon className="size-5 text-destructive" />
            ) : (
              <AlertTriangleIcon className="size-5 text-primary-ink" />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <DialogTitle className="font-mono text-sm font-bold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-dashed border-border" />

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 flex-1 rounded-xs border border-border bg-background px-4 py-2 font-mono text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted hover:text-foreground"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={
              isDestructive
                ? "min-h-11 flex-1 rounded-xs border border-destructive bg-destructive px-4 py-2 font-mono text-sm font-medium uppercase tracking-wider text-destructive-foreground transition-colors hover:bg-destructive/80 disabled:opacity-50"
                : "min-h-11 flex-1 rounded-xs border border-primary bg-primary px-4 py-2 font-mono text-sm font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            }
          >
            {isPending ? t.form.processing : resolvedConfirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
