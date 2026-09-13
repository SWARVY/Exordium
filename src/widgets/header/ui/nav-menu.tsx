import { routes } from "@shared/constants/routes"
import { useT } from "@shared/i18n"
import { Link } from "@tanstack/react-router"

export function NavMenu() {
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
              className="inline-flex min-h-11 items-center rounded-xs px-3 py-2 font-mono text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
