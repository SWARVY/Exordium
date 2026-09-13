import { useCallback, useEffect, useRef } from "react"

import type { PostDraft } from "@entities/post"

const DRAFT_KEY = "post-editor-draft"
const DRAFT_VERSION = 1
const AUTO_SAVE_INTERVAL_MS = 30_000

export type DraftSnapshot = Partial<PostDraft> & { baseUpdatedAt?: string }

export type StoredPostDraft = DraftSnapshot & {
  version: typeof DRAFT_VERSION
  savedAt: string
}

export type DraftLoadResult =
  | { status: "empty" }
  | { status: "ready"; draft: StoredPostDraft; legacy?: boolean }
  | { status: "corrupt" }
  | { status: "unavailable" }

export type DraftSaveResult =
  | { status: "saved"; savedAt: string }
  | { status: "blocked" }
  | { status: "unavailable" }

export type DraftClearResult = { status: "cleared" } | { status: "unavailable" }

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string"
}

function parseStoredDraft(raw: string): StoredPostDraft | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  if (candidate.version !== undefined && candidate.version !== DRAFT_VERSION) return null
  if (typeof candidate.savedAt !== "string" || Number.isNaN(Date.parse(candidate.savedAt)))
    return null
  if (
    !isOptionalString(candidate.title) ||
    !isOptionalString(candidate.description) ||
    !isOptionalString(candidate.content) ||
    !isOptionalString(candidate.slug) ||
    !isOptionalString(candidate.coverImage) ||
    !isOptionalString(candidate.baseUpdatedAt) ||
    (candidate.tags !== undefined &&
      (!Array.isArray(candidate.tags) || candidate.tags.some((tag) => typeof tag !== "string")))
  ) {
    return null
  }

  return {
    version: DRAFT_VERSION,
    savedAt: candidate.savedAt,
    ...(candidate.title === undefined ? {} : { title: candidate.title }),
    ...(candidate.description === undefined ? {} : { description: candidate.description }),
    ...(candidate.content === undefined ? {} : { content: candidate.content }),
    ...(candidate.slug === undefined ? {} : { slug: candidate.slug }),
    ...(candidate.coverImage === undefined ? {} : { coverImage: candidate.coverImage }),
    ...(candidate.baseUpdatedAt === undefined ? {} : { baseUpdatedAt: candidate.baseUpdatedAt }),
    ...(candidate.tags === undefined ? {} : { tags: candidate.tags }),
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function useDraftAutoSave(
  getValue: () => DraftSnapshot,
  postId?: string,
  options: { enabled?: boolean; onSaved?: (savedAt: string) => void } = {},
  ownerId?: string,
) {
  const key = `${DRAFT_KEY}:${ownerId ?? "anonymous"}:${postId ?? "new"}`
  const getValueRef = useRef(getValue)
  const keyRef = useRef(key)
  const legacyKeyRef = useRef(postId ? `${DRAFT_KEY}-${postId}` : DRAFT_KEY)
  const loadedLegacyKeyRef = useRef<string | null>(null)
  const enabledRef = useRef(options.enabled ?? true)
  const onSavedRef = useRef(options.onSaved)
  const writeBlockedRef = useRef(false)
  getValueRef.current = getValue
  keyRef.current = key
  enabledRef.current = options.enabled ?? true
  onSavedRef.current = options.onSaved

  const loadDraft = useCallback((): DraftLoadResult => {
    const storage = getStorage()
    if (!storage) return { status: "unavailable" }

    let raw: string | null
    try {
      raw = storage.getItem(keyRef.current)
      loadedLegacyKeyRef.current = null
      if (!raw && ownerId) {
        raw = storage.getItem(legacyKeyRef.current)
        if (raw) loadedLegacyKeyRef.current = legacyKeyRef.current
      }
    } catch {
      return { status: "unavailable" }
    }
    if (!raw) {
      writeBlockedRef.current = false
      return { status: "empty" }
    }

    const draft = parseStoredDraft(raw)
    if (!draft) {
      writeBlockedRef.current = true
      return { status: "corrupt" }
    }
    writeBlockedRef.current = false
    return { status: "ready", draft, ...(loadedLegacyKeyRef.current ? { legacy: true } : {}) }
  }, [ownerId])

  const saveDraft = useCallback((): DraftSaveResult => {
    if (writeBlockedRef.current) return { status: "blocked" }
    const storage = getStorage()
    if (!storage) return { status: "unavailable" }
    const savedAt = new Date().toISOString()
    try {
      storage.setItem(
        keyRef.current,
        JSON.stringify({ version: DRAFT_VERSION, ...getValueRef.current(), savedAt }),
      )
      if (loadedLegacyKeyRef.current) storage.removeItem(loadedLegacyKeyRef.current)
      loadedLegacyKeyRef.current = null
      return { status: "saved", savedAt }
    } catch {
      return { status: "unavailable" }
    }
  }, [])

  const clearDraft = useCallback((): DraftClearResult => {
    const storage = getStorage()
    if (!storage) return { status: "unavailable" }
    try {
      storage.removeItem(keyRef.current)
      if (loadedLegacyKeyRef.current) storage.removeItem(loadedLegacyKeyRef.current)
      loadedLegacyKeyRef.current = null
      writeBlockedRef.current = false
      return { status: "cleared" }
    } catch {
      return { status: "unavailable" }
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!enabledRef.current) return
      const result = saveDraft()
      if (result.status === "saved") onSavedRef.current?.(result.savedAt)
    }, AUTO_SAVE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [saveDraft])

  return { saveDraft, loadDraft, clearDraft }
}
