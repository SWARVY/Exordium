import { supabase } from "@shared/api/supabase-client"
import { buildCanonicalUrl } from "@shared/constants/seo"
import { createFileRoute } from "@tanstack/react-router"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = ["/", "/posts", "/projects"].map(
          (path) => `<url><loc>${escapeXml(buildCanonicalUrl(path))}</loc></url>`,
        )
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase
            .from("posts")
            .select("slug,updated_at")
            .not("published_at", "is", null)
            .order("id")
            .range(offset, offset + 999)
          if (error) return new Response("Sitemap temporarily unavailable", { status: 503 })
          for (const post of data ?? []) {
            entries.push(
              `<url><loc>${escapeXml(buildCanonicalUrl(`/posts/${encodeURIComponent(post.slug)}`))}</loc><lastmod>${escapeXml(post.updated_at)}</lastmod></url>`,
            )
          }
          if (!data || data.length < 1000) break
        }
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`,
          {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          },
        )
      },
    },
  },
})
