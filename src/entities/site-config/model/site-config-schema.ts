import * as v from "valibot"

export const SiteConfigSchema = v.object({
  postsSubtitle: v.string(),
  projectsSubtitle: v.string(),
})

export type SiteConfig = v.InferOutput<typeof SiteConfigSchema>
