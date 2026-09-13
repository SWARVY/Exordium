const baseUrl = (import.meta.env.VITE_SITE_URL || "https://forimaginary.dev").replace(/\/$/, "")

export const seo = {
  baseUrl,
  siteName: "Exordium",
  defaultTitle: "Exordium",
  defaultDescription: "A personal blog about development and open source.",
  defaultOgImage: `${baseUrl}/og-default.png`,
  twitterHandle: "@forimaginary",
} as const

export function buildCanonicalUrl(path: string): string {
  return new URL(path, `${seo.baseUrl}/`).href
}

export function buildHead({
  title,
  description,
  ogImage,
  path,
  type = "website",
  noIndex = false,
}: {
  title?: string
  description?: string
  ogImage?: string
  path: string
  type?: "website" | "article"
  noIndex?: boolean
}) {
  const resolvedTitle = title ? `${title} | ${seo.siteName}` : seo.defaultTitle
  const resolvedDescription = description ?? seo.defaultDescription
  const resolvedOgImage = ogImage ? buildCanonicalUrl(ogImage) : seo.defaultOgImage
  const canonicalUrl = buildCanonicalUrl(path)

  return {
    meta: [
      { title: resolvedTitle },
      { name: "description", content: resolvedDescription },
      { property: "og:title", content: resolvedTitle },
      { property: "og:description", content: resolvedDescription },
      { property: "og:image", content: resolvedOgImage },
      { property: "og:url", content: canonicalUrl },
      { property: "og:site_name", content: seo.siteName },
      { property: "og:type", content: type },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: seo.twitterHandle },
      { name: "twitter:title", content: resolvedTitle },
      { name: "twitter:description", content: resolvedDescription },
      { name: "twitter:image", content: resolvedOgImage },
      ...(noIndex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
  }
}
