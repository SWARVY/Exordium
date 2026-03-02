import { postKeys } from "@entities/post/api/post-keys"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { PostDraft } from "@entities/post"

async function updatePost({ id, draft }: { id: string; draft: PostDraft }) {
  const { data, error } = await supabase
    .from("posts")
    .update({
      slug: draft.slug,
      title: draft.title,
      description: draft.description,
      content: draft.content,
      cover_image: draft.coverImage || null,
      tags: draft.tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePost,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.slug) })
    },
  })
}
