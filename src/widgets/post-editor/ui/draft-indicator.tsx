import { useT } from "@shared/i18n"
import { Button } from "@shared/ui/components/button"

interface DraftIndicatorProps {
  savedAt?: string | null
  onSave: () => void
}

export function DraftIndicator({ savedAt, onSave }: DraftIndicatorProps) {
  const t = useT()
  const formattedTime = savedAt
    ? new Date(savedAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {formattedTime && <span>{t.postEditor.draftSaving(formattedTime)}</span>}
      <Button type="button" variant="ghost" size="sm" onClick={onSave}>
        {t.action.draftSave}
      </Button>
    </div>
  )
}
