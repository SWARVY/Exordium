import { routes } from "@shared/constants/routes"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { Link } from "@tanstack/react-router"
import { PencilIcon } from "lucide-react"
import { useEffect, useState } from "react"

export function WriteFab() {
  const isOwner = useIsOwner()
  const t = useT()
  const [isInlineEditing, setIsInlineEditing] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsInlineEditing(document.body.hasAttribute("data-inline-editing"))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-inline-editing"] })
    return () => observer.disconnect()
  }, [])

  if (!isOwner || isInlineEditing) return null

  return (
    <Link
      to={routes.posts.new}
      aria-label={t.aria.writePost}
      className="fixed bottom-20 right-5 z-50 sm:bottom-6 sm:right-6 flex items-center gap-2 rounded-full bg-primary px-4 py-3 shadow-lg shadow-primary/30 transition-all hover:opacity-90 hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0"
    >
      <PencilIcon className="size-4 text-primary-foreground" aria-hidden="true" />
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground sm:inline hidden">
        {t.action.write}
      </span>
    </Link>
  )
}
