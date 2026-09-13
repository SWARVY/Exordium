import { postKeys } from "@entities/post/api/post-keys"
import { supabase } from "@shared/api/supabase-client"
import { useT } from "@shared/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { PostDraft } from "@entities/post"

export class PostUpdateConflictError extends Error {
  constructor() {
    super("The post was changed after this editor loaded.")
    this.name = "PostUpdateConflictError"
  }
}

interface UpdatePostVariables {
  id: string
  draft: PostDraft
  updatedAt: string
  previousSlug: string
}

async function updatePost({ id, draft, updatedAt }: UpdatePostVariables) {
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
    .eq("updated_at", updatedAt)
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new PostUpdateConflictError()
  return data
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: updatePost,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      queryClient.invalidateQueries({ queryKey: postKeys.details() })
      queryClient.invalidateQueries({ queryKey: postKeys.searches() })
      if (variables.previousSlug !== data.slug) {
        queryClient.removeQueries({
          queryKey: postKeys.detail(variables.previousSlug),
          exact: true,
        })
      }
      toast.success(t.toast.postUpdated)
    },
    onError: () => {
      toast.error(t.toast.error)
    },
  })
}
