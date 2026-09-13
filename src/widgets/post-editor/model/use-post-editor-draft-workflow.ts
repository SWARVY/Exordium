import { useT } from "@shared/i18n"
import { useBlocker } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  useDraftAutoSave,
  type DraftLoadResult,
  type DraftSnapshot,
  type StoredPostDraft,
} from "./use-draft-auto-save"

export type DraftDecision =
  | { status: "checking" | "none" | "corrupt" | "unavailable" }
  | { status: "ready"; draft: StoredPostDraft; legacy?: boolean }

interface PostEditorDraftWorkflowOptions {
  getValue: () => DraftSnapshot
  postId?: string
  ownerId?: string
  identityReady: boolean
  persistenceAllowed: boolean
  applyDraft: (draft: StoredPostDraft) => void
  applyOriginal: () => void
  onLeave: () => void
}

export function usePostEditorDraftWorkflow({
  getValue,
  postId,
  ownerId,
  identityReady,
  persistenceAllowed,
  applyDraft,
  applyOriginal,
  onLeave,
}: PostEditorDraftWorkflowOptions) {
  const t = useT()
  const applyDraftRef = useRef(applyDraft)
  const applyOriginalRef = useRef(applyOriginal)
  const onLeaveRef = useRef(onLeave)
  const allowNavigationRef = useRef(false)
  const dirtyRef = useRef(false)
  applyDraftRef.current = applyDraft
  applyOriginalRef.current = applyOriginal
  onLeaveRef.current = onLeave

  const [draftDecision, setDraftDecision] = useState<DraftDecision>({ status: "checking" })
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState<string | null>(null)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  dirtyRef.current = isDirty

  const shouldBlockNavigation = useCallback(
    () => dirtyRef.current && !allowNavigationRef.current,
    [],
  )
  const blocker = useBlocker({
    shouldBlockFn: shouldBlockNavigation,
    enableBeforeUnload: shouldBlockNavigation,
    withResolver: true,
  })

  const { saveDraft, loadDraft, clearDraft } = useDraftAutoSave(
    getValue,
    postId,
    {
      enabled:
        identityReady &&
        persistenceAllowed &&
        isDirty &&
        draftDecision.status !== "checking" &&
        draftDecision.status !== "ready" &&
        draftDecision.status !== "corrupt",
      onSaved: setDraftSavedAt,
    },
    ownerId,
  )

  useEffect(() => {
    if (!identityReady || !ownerId) return
    const result: DraftLoadResult = loadDraft()
    if (result.status === "ready") {
      setDraftSavedAt(result.draft.savedAt)
      setDraftDecision(result)
      return
    }
    setDraftDecision(result.status === "empty" ? { status: "none" } : result)
    if (result.status === "unavailable") setDraftMessage(t.editing.storageUnavailable)
  }, [identityReady, loadDraft, ownerId, postId, t.editing.storageUnavailable])

  useEffect(() => {
    if (!identityReady && ownerId && dirtyRef.current && persistenceAllowed) saveDraft()
  }, [identityReady, ownerId, persistenceAllowed, saveDraft])

  useEffect(() => {
    const handlePageHide = () => {
      if (identityReady && dirtyRef.current && !allowNavigationRef.current && persistenceAllowed) {
        saveDraft()
      }
    }
    window.addEventListener("pagehide", handlePageHide)
    return () => {
      window.removeEventListener("pagehide", handlePageHide)
    }
  }, [identityReady, persistenceAllowed, saveDraft])

  const markDirty = useCallback(() => setIsDirty(true), [])

  const restoreDraft = useCallback(() => {
    if (draftDecision.status !== "ready") return
    applyDraftRef.current(draftDecision.draft)
    setRestoredDraft(true)
    setIsDirty(true)
    setDraftDecision({ status: "none" })
  }, [draftDecision])

  const discardPendingDraft = useCallback(() => {
    const result = clearDraft()
    if (result.status === "unavailable") {
      setDraftMessage(t.editing.storageUnavailable)
      return
    }
    setDraftSavedAt(null)
    setDraftDecision({ status: "none" })
  }, [clearDraft, t.editing.storageUnavailable])

  const recoverOriginalDocument = useCallback(() => {
    discardPendingDraft()
    applyOriginalRef.current()
    setRestoredDraft(false)
    setIsDirty(false)
  }, [discardPendingDraft])

  const saveManually = useCallback(() => {
    if (!identityReady || !ownerId) {
      setDraftMessage(t.editing.storageUnavailable)
      return
    }
    setDraftMessage(null)
    const result = saveDraft()
    if (result.status === "saved") {
      setDraftSavedAt(result.savedAt)
      return
    }
    setDraftMessage(
      result.status === "blocked" ? t.editing.corruptDescription : t.editing.draftSaveFailed,
    )
  }, [
    identityReady,
    ownerId,
    saveDraft,
    t.editing.corruptDescription,
    t.editing.draftSaveFailed,
    t.editing.storageUnavailable,
  ])

  const requestExit = useCallback(() => {
    if (isDirty) {
      setExitDialogOpen(true)
      return
    }
    onLeaveRef.current()
  }, [isDirty])

  const keepDraftAndExit = useCallback(() => {
    if (!identityReady || !ownerId) {
      setDraftMessage(t.editing.storageUnavailable)
      setExitDialogOpen(false)
      return
    }
    const result = saveDraft()
    if (result.status !== "saved") {
      setDraftMessage(t.editing.draftSaveFailed)
      setExitDialogOpen(false)
      return
    }
    setDraftSavedAt(result.savedAt)
    allowNavigationRef.current = true
    dirtyRef.current = false
    setIsDirty(false)
    setExitDialogOpen(false)
    if (blocker.status === "blocked") blocker.proceed()
    else onLeaveRef.current()
  }, [
    blocker,
    identityReady,
    ownerId,
    saveDraft,
    t.editing.draftSaveFailed,
    t.editing.storageUnavailable,
  ])

  const discardAndExit = useCallback(() => {
    const result = clearDraft()
    if (result.status === "unavailable") {
      setDraftMessage(t.editing.storageUnavailable)
      setExitDialogOpen(false)
      return
    }
    allowNavigationRef.current = true
    dirtyRef.current = false
    setIsDirty(false)
    setExitDialogOpen(false)
    if (blocker.status === "blocked") blocker.proceed()
    else onLeaveRef.current()
  }, [blocker, clearDraft, t.editing.storageUnavailable])

  const closeExitDialog = useCallback(() => {
    setExitDialogOpen(false)
    if (blocker.status === "blocked") blocker.reset()
  }, [blocker])

  const finishSave = useCallback(() => {
    allowNavigationRef.current = true
    dirtyRef.current = false
    clearDraft()
    setIsDirty(false)
  }, [clearDraft])

  return {
    draftDecision,
    draftSavedAt,
    draftMessage,
    restoredDraft,
    exitDialogOpen: exitDialogOpen || blocker.status === "blocked",
    draftDecisionBlocksSave:
      draftDecision.status === "checking" ||
      draftDecision.status === "ready" ||
      draftDecision.status === "corrupt",
    markDirty,
    restoreDraft,
    discardPendingDraft,
    recoverOriginalDocument,
    saveManually,
    requestExit,
    keepDraftAndExit,
    discardAndExit,
    closeExitDialog,
    finishSave,
  }
}
