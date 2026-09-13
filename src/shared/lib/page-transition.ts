import type { AnyRouter } from "@tanstack/react-router"

function isEditor(pathname: string) {
  return pathname === "/posts/new" || pathname.endsWith("/edit")
}

type PageTransitionOptions = Exclude<
  AnyRouter["options"]["defaultViewTransition"],
  boolean | undefined
>

export function createPageTransition(initialPathname?: string): PageTransitionOptions {
  return {
    types: ({ fromLocation, toLocation }) => {
      // The first navigation after SSR may not yet have a resolvedLocation.
      const previousPathname = fromLocation?.pathname ?? initialPathname
      if (
        !previousPathname ||
        previousPathname === toLocation.pathname ||
        isEditor(previousPathname) ||
        isEditor(toLocation.pathname) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return false
      }
      return ["page"]
    },
  }
}
