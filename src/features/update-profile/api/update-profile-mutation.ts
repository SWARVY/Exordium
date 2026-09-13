import { ownerKeys } from "@entities/owner/api/owner-keys"
import { supabase } from "@shared/api/supabase-client"
import { useT } from "@shared/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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
    const { data, error } = await supabase
      .from("owner_profile")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .maybeSingle()
    if (error) throw error
    if (!data || data.id !== existing.id) throw new Error("The profile could not be updated.")
  } else {
    const { data, error } = await supabase
      .from("owner_profile")
      .insert(payload)
      .select("id")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("The profile could not be created.")
  }
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.profile() })
      toast.success(t.toast.profileSaved)
    },
    onError: () => {
      toast.error(t.toast.error)
    },
  })
}
