import { useEffect, useRef } from "react"

import type { PostDraft } from "@entities/post"

const DRAFT_KEY = "post-editor-draft"
const AUTO_SAVE_INTERVAL_MS = 30_000

export function useDraftAutoSave(getValue: () => Partial<PostDraft>, postId?: string) {
  const key = postId ? `${DRAFT_KEY}-${postId}` : DRAFT_KEY

  // Stable ref so the interval callback always reads the latest getValue/key
  // without needing to restart the interval on every render.
  const saveDraftRef = useRef(() => {
    if (typeof window === "undefined") return
    const value = getValue()
    localStorage.setItem(key, JSON.stringify({ ...value, savedAt: new Date().toISOString() }))
  })
  saveDraftRef.current = () => {
    if (typeof window === "undefined") return
    const value = getValue()
    localStorage.setItem(key, JSON.stringify({ ...value, savedAt: new Date().toISOString() }))
  }

  const saveDraft = () => saveDraftRef.current()

  const loadDraft = (): (Partial<PostDraft> & { savedAt?: string }) | null => {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const clearDraft = () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(key)
  }

  useEffect(() => {
    const id = setInterval(() => saveDraftRef.current(), AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return { saveDraft, loadDraft, clearDraft }
}
