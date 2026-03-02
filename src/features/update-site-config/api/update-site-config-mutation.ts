import { siteConfigKeys } from "@entities/site-config"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { SiteConfig } from "@entities/site-config"

async function updateSiteConfig(patch: Partial<SiteConfig>) {
  const rows: { key: string; value: string; updated_at: string }[] = []
  const now = new Date().toISOString()

  if (patch.postsSubtitle !== undefined)
    rows.push({ key: "posts_subtitle", value: patch.postsSubtitle, updated_at: now })
  if (patch.projectsSubtitle !== undefined)
    rows.push({ key: "open_source_subtitle", value: patch.projectsSubtitle, updated_at: now })

  if (rows.length === 0) return

  const { error } = await supabase.from("site_config").upsert(rows, { onConflict: "key" })
  if (error) throw error
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSiteConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteConfigKeys.config() })
    },
  })
}
