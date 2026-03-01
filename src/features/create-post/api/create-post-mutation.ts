import { postKeys } from "@entities/post/api/post-keys"
import { supabase } from "@shared/api/supabase-client"
import { queryClient } from "@shared/lib/query-client"
import { useMutation } from "@tanstack/react-query"

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
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}
