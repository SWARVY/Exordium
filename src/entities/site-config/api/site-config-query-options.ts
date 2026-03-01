import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { siteConfigKeys } from "./site-config-keys"

import type { SiteConfig } from "../model/site-config-schema"

const DEFAULTS: SiteConfig = {
  postsSubtitle: "개발하며 배운 것들, 생각한 것들을 기록합니다.",
  projectsSubtitle: "직접 만들고 관리하는 프로젝트들입니다.",
}

export const siteConfigQueryOptions = {
  config: () =>
    queryOptions({
      queryKey: siteConfigKeys.config(),
      queryFn: async (): Promise<SiteConfig> => {
        const { data, error } = await supabase
          .from("site_config")
          .select("key, value")
          .in("key", ["posts_subtitle", "open_source_subtitle"])
        if (error) throw error

        const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
        return {
          postsSubtitle: map["posts_subtitle"] ?? DEFAULTS.postsSubtitle,
          projectsSubtitle: map["open_source_subtitle"] ?? DEFAULTS.projectsSubtitle,
        }
      },
    }),
}
