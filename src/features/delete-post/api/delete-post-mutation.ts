import { postKeys } from "@entities/post/api/post-keys"
import { supabase } from "@shared/api/supabase-client"
import { queryClient } from "@shared/lib/query-client"
import { useMutation } from "@tanstack/react-query"

async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id)
  if (error) throw error
}

export function useDeletePost() {
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}
