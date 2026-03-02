import { siteConfigQueryOptions } from "@entities/site-config"
import { useUpdateSiteConfig } from "@features/update-site-config"
import { useIsOwner } from "@shared/hooks/use-is-owner"
import { useT } from "@shared/i18n"
import { useSuspenseQuery } from "@suspensive/react-query-5"
import { CheckIcon, PencilIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"

import type { SiteConfig } from "@entities/site-config"

interface PageHeroProps {
  tag: string
  title: string
  /** SiteConfig에서 어떤 필드를 subtitle로 쓸지 */
  subtitleKey: keyof Pick<SiteConfig, "postsSubtitle" | "projectsSubtitle">
}

export function PageHero({ tag, title, subtitleKey }: PageHeroProps) {
  const t = useT()
  const { data: config } = useSuspenseQuery(siteConfigQueryOptions.config())
  const { mutate: updateConfig, isPending } = useUpdateSiteConfig()
  const isOwner = useIsOwner()

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function startEdit() {
    setDraft(config[subtitleKey])
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === config[subtitleKey]) {
      setIsEditing(false)
      return
    }
    updateConfig({ [subtitleKey]: trimmed }, { onSuccess: () => setIsEditing(false) })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === "Escape") {
      setIsEditing(false)
    }
  }

  return (
    <section className="grid-paper border-b border-border" aria-label={t.aria.pageHeader(title)}>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          — {tag}
        </span>
        <h1 className="mt-2 text-5xl font-black tracking-tight text-foreground sm:text-6xl">
          {title}
        </h1>

        {/* Subtitle */}
        <div className="mt-4 flex items-start gap-2">
          {isEditing ? (
            <>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="max-w-md flex-1 resize-none rounded-sm border border-primary bg-card px-3 py-1.5 font-mono text-sm leading-relaxed text-foreground outline-none ring-2 ring-primary/20"
              />
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  aria-label={t.action.save}
                  className="flex size-7 items-center justify-center rounded-sm border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                >
                  <CheckIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  aria-label={t.action.cancel}
                  className="flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="max-w-md font-mono text-sm leading-relaxed text-muted-foreground">
                {config[subtitleKey]}
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={startEdit}
                  aria-label={t.aria.subtitleEdit}
                  className="mt-0.5 flex size-6 items-center justify-center rounded-sm text-muted-foreground/30 transition-colors hover:text-primary"
                >
                  <PencilIcon className="size-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
