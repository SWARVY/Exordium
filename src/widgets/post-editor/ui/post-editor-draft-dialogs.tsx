import { useT } from "@shared/i18n"
import { Button } from "@shared/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/components/dialog"

import type { DraftDecision } from "../model/use-post-editor-draft-workflow"

interface PostEditorDraftDialogsProps {
  draftDecision: DraftDecision
  exitDialogOpen: boolean
  onDiscardPendingDraft: () => void
  onRestoreDraft: () => void
  onCloseExit: () => void
  onDiscardAndExit: () => void
  onKeepDraftAndExit: () => void
}

function formatSavedTime(savedAt: string) {
  return new Date(savedAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PostEditorDraftDialogs({
  draftDecision,
  exitDialogOpen,
  onDiscardPendingDraft,
  onRestoreDraft,
  onCloseExit,
  onDiscardAndExit,
  onKeepDraftAndExit,
}: PostEditorDraftDialogsProps) {
  const t = useT()

  return (
    <>
      <Dialog open={draftDecision.status === "ready" || draftDecision.status === "corrupt"}>
        <DialogContent showCloseButton={false} className="bg-card">
          {draftDecision.status === "ready" ? (
            <>
              <DialogHeader>
                <DialogTitle>{t.editing.restoreTitle}</DialogTitle>
                <DialogDescription>
                  {draftDecision.legacy
                    ? t.editing.legacyDraftDescription
                    : t.editing.restoreDescription(formatSavedTime(draftDecision.draft.savedAt))}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" onClick={onDiscardPendingDraft} variant="outline">
                  {t.editing.discardDraft}
                </Button>
                <Button type="button" onClick={onRestoreDraft}>
                  {t.editing.restoreAction}
                </Button>
              </DialogFooter>
            </>
          ) : draftDecision.status === "corrupt" ? (
            <>
              <DialogHeader>
                <DialogTitle>{t.editing.corruptTitle}</DialogTitle>
                <DialogDescription>{t.editing.corruptDescription}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" onClick={onDiscardPendingDraft} variant="destructive">
                  {t.editing.discardCorruptDraft}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={exitDialogOpen} onOpenChange={(open) => !open && onCloseExit()}>
        <DialogContent showCloseButton={false} className="bg-card">
          <DialogHeader>
            <DialogTitle>{t.editing.exitTitle}</DialogTitle>
            <DialogDescription>{t.editing.exitDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-col">
            <Button type="button" onClick={onCloseExit} variant="outline">
              {t.editing.continueEditing}
            </Button>
            <Button
              type="button"
              onClick={onDiscardAndExit}
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              {t.editing.discardAndExit}
            </Button>
            <Button type="button" onClick={onKeepDraftAndExit}>
              {t.editing.keepDraftAndExit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
