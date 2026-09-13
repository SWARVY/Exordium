import { createPageTransition } from "@shared/lib/page-transition"
import { NotFoundPage } from "@shared/ui/components/error-page/not-found-page"
import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"

import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        retry: 1,
      },
    },
  })

  const router = createTanStackRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
    defaultViewTransition: createPageTransition(
      typeof window === "undefined" ? undefined : window.location.pathname,
    ),
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    context: { queryClient },
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
