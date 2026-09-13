import { useHydrated } from "@shared/hooks/use-hydrated"
import { useT } from "@shared/i18n"
import { Button } from "@shared/ui/components/button"
import {
  Popover,
  PopoverTrigger,
  PopoverPositioner,
  PopoverContent,
  PopoverTitle,
  PopoverClose,
} from "@shared/ui/components/popover"
import { EllipsisIcon, XIcon } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

import { PostTagLink } from "./post-tag-link"

interface PostTagsProps {
  tags: string[]
}

export function PostTags({ tags }: PostTagsProps) {
  const t = useT()
  const hydrated = useHydrated()
  const rowRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState({ count: 1, overflow: tags.length > 1 })
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    const row = rowRef.current
    const measure = measureRef.current
    if (!row || !measure) {
      setOpen(false)
      return
    }

    const update = () => {
      const widths = Array.from(measure.children, (child) => child.getBoundingClientRect().width)
      const buttonWidth = widths.pop() ?? 0
      const gap = parseFloat(getComputedStyle(row).columnGap)
      const total = widths.reduce((sum, width) => sum + width, 0) + gap * (tags.length - 1)
      const overflow = total > row.clientWidth
      if (!overflow) setOpen(false)
      let count = tags.length
      if (overflow) {
        let occupied = buttonWidth
        count = 0
        for (const width of widths) {
          occupied += gap + width
          if (occupied > row.clientWidth) break
          count++
        }
      }
      count = Math.max(1, count)
      setPreview((previous) =>
        previous.count === count && previous.overflow === overflow ? previous : { count, overflow },
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(row)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [tags])

  if (tags.length === 0) return null

  const remaining = tags.length - preview.count

  return (
    <div ref={rowRef} className="relative flex h-11 min-w-0 items-center gap-1.5">
      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute inset-0 overflow-hidden"
      >
        <div ref={measureRef} className="flex w-max items-center gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="flex min-h-11 min-w-11 shrink-0 items-center">
              <span className="post-tag">{tag}</span>
            </span>
          ))}
          <span className="size-11 shrink-0" />
        </div>
      </div>
      {tags.slice(0, preview.count).map((tag) => (
        <PostTagLink key={tag} tag={tag} />
      ))}
      {preview.overflow && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={!hydrated}
            aria-label={t.post.showAllTags(tags.length)}
            render={<Button variant="ghost" size="icon" />}
            className="relative z-10"
          >
            {remaining > 0 ? (
              <span className="type-meta font-mono font-semibold">+{remaining}</span>
            ) : (
              <EllipsisIcon aria-hidden="true" className="size-4" />
            )}
          </PopoverTrigger>
          <PopoverPositioner side="bottom" align="end" sideOffset={8} collisionPadding={16}>
            <PopoverContent className="w-72 p-0">
              <div className="flex items-center justify-between gap-3 bg-primary py-1 pl-4 pr-1 text-primary-foreground">
                <PopoverTitle>{t.post.tags}</PopoverTitle>
                <PopoverClose
                  aria-label={t.action.close}
                  render={<Button variant="ghost" size="icon" />}
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
                >
                  <XIcon aria-hidden="true" className="size-4" />
                </PopoverClose>
              </div>
              <ul
                aria-label={t.post.tags}
                className="flex max-h-[min(20rem,50dvh)] flex-wrap gap-2 overflow-y-auto p-4"
              >
                {tags.map((tag) => (
                  <li key={tag} className="min-w-0 max-w-full">
                    <PostTagLink tag={tag} wrap onNavigate={() => setOpen(false)} />
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </PopoverPositioner>
        </Popover>
      )}
    </div>
  )
}
