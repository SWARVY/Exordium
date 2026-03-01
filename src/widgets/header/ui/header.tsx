import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { Link } from "@tanstack/react-router"
import { SearchIcon } from "lucide-react"
import { useState } from "react"

import { SearchOverlay } from "@widgets/search"
import { NavMenu } from "./nav-menu"
import { ThemeSelector } from "./theme-selector"

export function Header() {
  const t = useT()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to={routes.home} className="group flex items-center gap-2.5" aria-label={t.aria.goHome}>
            <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-foreground transition-colors group-hover:text-primary">
              EXORDIUM
            </span>
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-1">
            {/* Nav links: desktop only */}
            <div className="hidden sm:block">
              <NavMenu />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t.search.openSearch}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <SearchIcon className="size-4" />
            </button>
            <ThemeSelector />
          </div>
        </div>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
