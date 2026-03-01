import { LoginButton, LogoutButton } from "@features/auth"
import { useT } from "@shared/i18n"
import { routes } from "@shared/constants/routes"
import { AuthContext } from "@shared/ui/providers/auth-provider"
import { Link } from "@tanstack/react-router"
import { useContext } from "react"

export function NavMenu() {
  const { session } = useContext(AuthContext)
  const t = useT()

  const NAV_LINKS = [
    { label: t.nav.posts, to: routes.posts.list },
    { label: t.nav.projects, to: routes.projects },
  ]

  return (
    <nav aria-label={t.aria.mainNav}>
      <ul className="flex items-center gap-0.5">
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="rounded-full px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li className="ml-1">{session ? <LogoutButton /> : <LoginButton />}</li>
      </ul>
    </nav>
  )
}
