import { useT } from "@shared/i18n"
import { Button } from "@shared/ui/components/button"

interface PostEditorActionsProps {
  draftLabel: string
  submitLabel: string
  draftDisabled: boolean
  submitDisabled: boolean
  onSaveDraft: () => void
  onCancel: () => void
}

export function PostEditorActions({
  draftLabel,
  submitLabel,
  draftDisabled,
  submitDisabled,
  onSaveDraft,
  onCancel,
}: PostEditorActionsProps) {
  const t = useT()
  return (
    <div
      role="toolbar"
      aria-label={t.editing.actionsLabel}
      className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-card p-3 sm:bottom-0"
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-2 sm:flex sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          disabled={draftDisabled}
          className="min-w-0 px-2 tracking-tight sm:px-4"
        >
          {draftLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="min-w-0 px-2 sm:px-4">
          {t.action.cancel}
        </Button>
        <Button type="submit" disabled={submitDisabled} className="min-w-0 px-2 sm:px-4">
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
