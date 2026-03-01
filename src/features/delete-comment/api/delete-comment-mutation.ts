import { commentKeys } from "@entities/comment/api/comment-keys"
import { supabase } from "@shared/api/supabase-client"
import { queryClient } from "@shared/lib/query-client"
import { useMutation } from "@tanstack/react-query"

async function deleteComment({ id, postId }: { id: string; postId: string }) {
  const { error } = await supabase.from("comments").delete().eq("id", id)
  if (error) throw error
  return postId
}

export function useDeleteComment(postId: string) {
  return useMutation({
    mutationFn: (id: string) => deleteComment({ id, postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) })
    },
  })
}
