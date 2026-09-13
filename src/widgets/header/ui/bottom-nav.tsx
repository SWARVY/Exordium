import { LoginButton, LogoutButton } from "@features/auth"
import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background sm:hidden"
      aria-label={t.aria.bottomNav}
    >
      <ul className="flex min-h-16 items-center justify-around px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <li key={to} className="min-w-0 flex-1">
            <Link
              to={to}
              className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-center font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors [overflow-wrap:anywhere] hover:text-foreground [&.active]:text-primary-ink"
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="max-w-full">{label}</span>
            </Link>
          </li>
        ))}
        <li className="flex min-w-0 flex-1 flex-col items-center justify-center">
          {session ? <LogoutButton variant="navigation" /> : <LoginButton variant="navigation" />}
        </li>
      </ul>
    </nav>
  )
}
