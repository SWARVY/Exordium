import { useRouter } from "@tanstack/react-router"
import Lenis from "lenis"
import { useEffect } from "react"

import { useIsWriteActionEditing } from "./write-action-provider"

export function ReadingScroll({ disabled }: { disabled: boolean }) {
  const router = useRouter()
  const editing = useIsWriteActionEditing()

  useEffect(() => {
    if (disabled || editing) return

    const preference = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    )
    let lenis: Lenis | undefined

    function syncScrollLock() {
      // Base UI can lock either scrolling element, depending on the browser's scrollbars.
      const locked = [document.documentElement, document.body].some((node) =>
        ["hidden", "clip"].includes(node.style.overflowY),
      )
      if (locked) lenis?.stop()
      else lenis?.start()
    }

    function syncPreference() {
      lenis?.destroy()
      lenis = preference.matches
        ? new Lenis({
            autoRaf: true,
            lerp: 0.18,
            syncTouch: false,
            allowNestedScroll: true,
            stopInertiaOnNavigate: true,
            prevent: (node) =>
              node.matches(
                "[role='dialog'], [role='alertdialog'], textarea, [contenteditable='true']",
              ),
          })
        : undefined
      syncScrollLock()
    }

    syncPreference()
    const scrollLock = new MutationObserver(syncScrollLock)
    for (const node of [document.documentElement, document.body]) {
      scrollLock.observe(node, { attributes: true, attributeFilter: ["style"] })
    }
    preference.addEventListener("change", syncPreference)
    // End wheel inertia before the router restores a history entry or anchor.
    const beforeNavigate = router.subscribe("onBeforeNavigate", () => {
      lenis?.scrollTo(window.scrollY, { immediate: true })
    })
    const resolved = router.subscribe("onResolved", () => lenis?.resize())

    return () => {
      beforeNavigate()
      resolved()
      preference.removeEventListener("change", syncPreference)
      scrollLock.disconnect()
      lenis?.destroy()
    }
  }, [disabled, editing, router])

  return null
}
