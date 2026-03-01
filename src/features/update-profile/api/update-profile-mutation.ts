import { ownerKeys } from "@entities/owner/api/owner-keys"
import { supabase } from "@shared/api/supabase-client"
import { queryClient } from "@shared/lib/query-client"
import { useMutation } from "@tanstack/react-query"

import type { OwnerProfileForm } from "@entities/owner"

async function updateProfile(form: OwnerProfileForm) {
  // owner_profile은 단일 행 — 기존 행 id를 먼저 조회해 WHERE 절에 사용
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
    const { error } = await supabase
      .from("owner_profile")
      .update(payload)
      .eq("id", existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from("owner_profile")
      .insert(payload)
    if (error) throw error
  }
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.profile() })
    },
  })
}
