import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react"

import type { ReactNode } from "react"

interface PostEditorAdditionalSettingsProps {
  children: ReactNode
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  tips: readonly string[]
}

export function PostEditorAdditionalSettings({
  children,
  label,
  open,
  onOpenChange,
  tips,
}: PostEditorAdditionalSettingsProps) {
  const panelId = "post-editor-additional-settings"

  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xs border border-border bg-card px-3 py-3 text-left text-sm font-semibold text-foreground"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontalIcon className="size-4 text-primary-ink" aria-hidden="true" />
          {label}
        </span>
        <ChevronDownIcon
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div id={panelId} hidden={!open} className="mt-4 flex flex-col gap-4">
        {children}

        <div className="border-t border-border pt-4">
          <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-primary-ink">
            // Tips
          </p>
          <ul className="flex flex-col gap-2">
            {tips.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-1.5 font-mono text-xs leading-relaxed text-muted-foreground"
              >
                <span className="mt-px shrink-0 text-primary-ink">›</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
