import { LoginButton, LogoutButton } from "@features/auth"
import { routes } from "@shared/constants/routes"
import { useHydrated } from "@shared/hooks/use-hydrated"
import { useT } from "@shared/i18n"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { Link } from "@tanstack/react-router"
import { SearchOverlay } from "@widgets/search"
import { SearchIcon } from "lucide-react"
import { useContext, useRef, useState } from "react"

import { NavMenu } from "./nav-menu"
import { ThemeSelector } from "./theme-selector"

export function Header() {
  const { session } = useContext(AuthContext)
  const t = useT()
  const hydrated = useHydrated()
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="page-shell flex min-h-16 flex-wrap items-center justify-between gap-x-4 py-2">
          <Link
            to={routes.home}
            className="group flex min-h-11 min-w-0 items-center gap-2.5"
            aria-label={t.aria.goHome}
          >
            <span className="truncate font-mono text-sm font-bold tracking-[0.2em] uppercase text-foreground transition-colors group-hover:text-primary-ink">
              EXORDIUM
            </span>
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          </Link>
          <div className="flex max-w-full flex-wrap items-center gap-1">
            {/* Nav links: desktop only */}
            <div className="hidden sm:block">
              <NavMenu />
            </div>
            <button
              disabled={!hydrated}
              ref={searchTriggerRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
              aria-label={t.search.openSearch}
              className="flex size-11 shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <SearchIcon className="size-4" aria-hidden="true" />
            </button>
            <ThemeSelector />
            <div className="hidden sm:block">
              {session ? <LogoutButton variant="icon" /> : <LoginButton variant="icon" />}
            </div>
          </div>
        </div>
      </header>
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  )
}
