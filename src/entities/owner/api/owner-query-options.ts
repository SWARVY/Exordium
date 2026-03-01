import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { ownerKeys } from "./owner-keys"

import type { OwnerProfile } from "../model/owner-schema"

export const ownerQueryOptions = {
  profile: () =>
    queryOptions({
      queryKey: ownerKeys.profile(),
      queryFn: async () => {
        const { data, error } = await supabase.from("owner_profile").select("*").maybeSingle()
        if (error) throw error
        if (!data) return null
        return {
          id: data.id,
          name: data.name,
          bio: data.bio,
          avatarUrl: data.avatar_url ?? null,
          githubUrl: data.github_url ?? null,
          twitterUrl: data.twitter_url ?? null,
          websiteUrl: data.website_url ?? null,
          skills: data.skills ?? [],
        } satisfies OwnerProfile
      },
    }),
}
