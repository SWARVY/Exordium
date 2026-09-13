import { buildCanonicalUrl } from "@shared/constants/seo"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            "User-agent: *",
            "Allow: /",
            "Disallow: /auth/",
            "Disallow: /posts/new",
            "Disallow: /posts/*/edit",
            `Sitemap: ${buildCanonicalUrl("/sitemap.xml")}`,
            "",
          ].join("\n"),
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        ),
    },
  },
})
