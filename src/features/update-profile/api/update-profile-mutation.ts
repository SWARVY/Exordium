import { ownerKeys } from "@entities/owner/api/owner-keys"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { OwnerProfileForm } from "@entities/owner"

async function updateProfile(form: OwnerProfileForm) {
  const { data: existing, error: fetchError } = await supabase
    .from("owner_profile")
    .select("id")
    .maybeSingle()
  if (fetchError) throw fetchError

  const payload = {
    name: form.name,
    bio: form.bio,
    avatar_url: form.avatarUrl || null,
    github_url: form.githubUrl || null,
    twitter_url: form.twitterUrl || null,
    website_url: form.websiteUrl || null,
    skills: form.skills,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase.from("owner_profile").update(payload).eq("id", existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from("owner_profile").insert(payload)
    if (error) throw error
  }
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.profile() })
    },
  })
}
