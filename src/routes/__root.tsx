import { seo } from "@shared/constants/seo"
import { LocaleProvider } from "@shared/i18n"
import { getThemeInitScript } from "@shared/lib/theme-init-script"
import { ErrorPage } from "@shared/ui/components/error-page/error-page"
import { NotFoundPage } from "@shared/ui/components/error-page/not-found-page"
import { AuthProvider } from "@shared/ui/providers/auth-provider"
import { ThemeProvider } from "@shared/ui/providers/theme-provider"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { type QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Outlet,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Footer } from "@widgets/footer"
import { BottomNav, Header, WriteFab } from "@widgets/header"

import appCss from "../styles.css?url"

const themeInitScript = getThemeInitScript()

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error, reset }) => <ErrorPage error={error} reset={reset} />,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: seo.defaultTitle },
      { name: "description", content: seo.defaultDescription },
      { property: "og:site_name", content: seo.siteName },
      { property: "og:image", content: seo.defaultOgImage },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isEditorPage = pathname === "/posts/new" || pathname.endsWith("/edit")

  return (
    <AuthProvider>
      <LocaleProvider>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
            <div className="h-16 sm:hidden" aria-hidden="true" />
            <BottomNav />
            {!isEditorPage && <WriteFab />}
          </div>
          {import.meta.env.DEV && (
            <TanStackDevtools
              config={{ position: "bottom-right" }}
              plugins={[
                {
                  name: "TanStack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
              ]}
            />
          )}
        </ThemeProvider>
      </LocaleProvider>
    </AuthProvider>
  )
}
