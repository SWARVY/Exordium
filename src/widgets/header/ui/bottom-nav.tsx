import { LoginButton, LogoutButton } from "@features/auth"
import { useT } from "@shared/i18n"
import { routes } from "@shared/constants/routes"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { Link } from "@tanstack/react-router"
import { FileTextIcon, GithubIcon, HomeIcon } from "lucide-react"
import { useContext } from "react"

export function BottomNav() {
  const { session } = useContext(AuthContext)
  const t = useT()

  const NAV_ITEMS = [
    { label: t.nav.home, to: routes.home, icon: HomeIcon },
    { label: t.nav.posts, to: routes.posts.list, icon: FileTextIcon },
    { label: t.nav.projects, to: routes.projects, icon: GithubIcon },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-border bg-background/95 backdrop-blur-md"
      aria-label={t.aria.bottomNav}
    >
      <ul className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
        <li className="flex-1 flex flex-col items-center justify-center">
          {session ? <LogoutButton /> : <LoginButton />}
        </li>
      </ul>
    </nav>
  )
}
