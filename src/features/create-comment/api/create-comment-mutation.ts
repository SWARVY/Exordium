import { commentKeys } from "@entities/comment/api/comment-keys"
import { supabase } from "@shared/api/supabase-client"
import { queryClient } from "@shared/lib/query-client"
import { useMutation } from "@tanstack/react-query"

import type { CreateComment } from "@entities/comment"

async function createComment({ postId, payload }: { postId: string; payload: CreateComment }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("로그인이 필요합니다.")

  const authorName =
    user.user_metadata?.user_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Anonymous"

  const authorAvatarUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      parent_id: payload.parentId ?? null,
      content: payload.content,
      author_id: user.id,
      author_name: authorName,
      author_avatar_url: authorAvatarUrl,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export function useCreateComment(postId: string) {
  return useMutation({
    mutationFn: (payload: CreateComment) => createComment({ postId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) })
    },
  })
}
