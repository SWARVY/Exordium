import { siteConfigKeys } from "@entities/site-config"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { SiteConfig } from "@entities/site-config"

async function updateSiteConfig(patch: Partial<SiteConfig>) {
  const entries: { key: string; value: string }[] = []
  const now = new Date().toISOString()

  if (patch.postsSubtitle !== undefined)
    entries.push({ key: "posts_subtitle", value: patch.postsSubtitle })
  if (patch.projectsSubtitle !== undefined)
    entries.push({ key: "open_source_subtitle", value: patch.projectsSubtitle })

  if (entries.length === 0) return patch

  await Promise.all(
    entries.map(async ({ key, value }) => {
      const { error } = await supabase
        .from("site_config")
        .update({ value, updated_at: now })
        .eq("key", key)
        .select("key, value")
        .single()
      if (error) throw error
    }),
  )

  return patch
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSiteConfig,
    onSuccess: (patch) => {
      queryClient.setQueryData<SiteConfig>(siteConfigKeys.config(), (current) =>
        current ? { ...current, ...patch } : current,
      )
      queryClient.invalidateQueries({ queryKey: siteConfigKeys.config() })
    },
  })
}
