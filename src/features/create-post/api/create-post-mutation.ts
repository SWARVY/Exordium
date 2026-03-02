import { postKeys } from "@entities/post/api/post-keys"
import { useT } from "@shared/i18n"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { PostDraft } from "@entities/post"

async function createPost(draft: PostDraft) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      slug: draft.slug,
      title: draft.title,
      description: draft.description,
      content: draft.content,
      cover_image: draft.coverImage || null,
      tags: draft.tags,
      published_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      toast.success(t.toast.postPublished)
    },
    onError: () => {
      toast.error(t.toast.error)
    },
  })
}
