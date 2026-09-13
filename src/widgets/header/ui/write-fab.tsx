import { routes } from "@shared/constants/routes"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { useIsWriteActionEditing } from "@shared/ui/providers/write-action-provider"
import { Link } from "@tanstack/react-router"
import { PencilIcon } from "lucide-react"
import { useEffect, useState } from "react"

export function WriteFab() {
  const isOwner = useIsOwner()
  const t = useT()
  const isEditing = useIsWriteActionEditing()
  const [legacyEditing, setLegacyEditing] = useState(false)
  useEffect(() => {
    const update = () => setLegacyEditing(document.body.hasAttribute("data-inline-editing"))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-inline-editing"] })
    return () => observer.disconnect()
  }, [])

  if (!isOwner || isEditing || legacyEditing) return null

  return (
    <Link
      to={routes.posts.new}
      aria-label={t.aria.writePost}
      className="write-fab fixed bottom-20 right-5 z-50 sm:bottom-6 sm:right-6 flex items-center gap-2 min-h-12 rounded-xs border border-primary-ink bg-card px-4 py-3 text-primary-ink"
    >
      <PencilIcon className="size-4" aria-hidden="true" />
      <span className="font-mono text-xs font-bold uppercase tracking-wider sm:inline hidden">
        {t.action.write}
      </span>
    </Link>
  )
}
