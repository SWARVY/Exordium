export const seo = {
  baseUrl: "https://forimaginary.dev",
  siteName: "Exordium",
  defaultTitle: "Exordium",
  defaultDescription: "A personal blog about development and open source.",
  defaultOgImage: "https://forimaginary.dev/og-default.png",
  twitterHandle: "@forimaginary",
} as const

export function buildCanonicalUrl(path: string): string {
  return `${seo.baseUrl}${path}`
}

export function buildMeta({
  title,
  description,
  ogImage,
  path,
}: {
  title?: string
  description?: string
  ogImage?: string
  path: string
}) {
  const resolvedTitle = title ? `${title} | ${seo.siteName}` : seo.defaultTitle
  const resolvedDescription = description ?? seo.defaultDescription
  const resolvedOgImage = ogImage ?? seo.defaultOgImage
  const canonicalUrl = buildCanonicalUrl(path)

  return [
    { title: resolvedTitle },
    { name: "description", content: resolvedDescription },
    { property: "og:title", content: resolvedTitle },
    { property: "og:description", content: resolvedDescription },
    { property: "og:image", content: resolvedOgImage },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: seo.siteName },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: seo.twitterHandle },
    { name: "twitter:title", content: resolvedTitle },
    { name: "twitter:description", content: resolvedDescription },
    { name: "twitter:image", content: resolvedOgImage },
    { rel: "canonical", href: canonicalUrl },
  ]
}
