import { ownerQueryOptions } from "@entities/owner"
import { useT } from "@shared/i18n"
import { routes } from "@shared/constants/routes"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { GithubIcon } from "lucide-react"
import { useEffect, useState } from "react"

export function Footer() {
  const t = useT()
  const [year, setYear] = useState(2026)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setYear(new Date().getFullYear())
    setMounted(true)
  }, [])
  const { data: owner } = useQuery(ownerQueryOptions.profile())

  const NAV_LINKS = [
    { label: t.nav.home, to: routes.home },
    { label: t.nav.posts, to: routes.posts.list },
    { label: t.nav.projects, to: routes.projects },
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Top row */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] opacity-90">
              Exordium
            </span>
            <p className="font-mono text-[11px] leading-relaxed opacity-50">
              {t.footer.tagline}
            </p>
          </div>

          {/* Nav + Connect */}
          <div className="flex gap-12">
            {/* Navigation */}
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">
                {t.footer.navigate}
              </span>
              <ul className="flex flex-col gap-2">
                {NAV_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="font-mono text-[11px] opacity-60 transition-opacity hover:opacity-100"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            {mounted && owner?.githubUrl && (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">
                  {t.footer.connect}
                </span>
                <ul className="flex flex-col gap-2">
                  <li>
                    <a
                      href={owner.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-mono text-[11px] opacity-60 transition-opacity hover:opacity-100"
                    >
                      <GithubIcon className="size-3" />
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-primary-foreground/10" />

        {/* Bottom row */}
        <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] opacity-40">© {year} Exordium</p>
          <p className="font-mono text-[10px] opacity-30">{t.footer.builtWith}</p>
        </div>
      </div>
    </footer>
  )
}
