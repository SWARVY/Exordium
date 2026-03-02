import { postKeys } from "@entities/post/api/post-keys"
import { useT } from "@shared/i18n"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id)
  if (error) throw error
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      toast.success(t.toast.postDeleted)
    },
    onError: () => {
      toast.error(t.toast.error)
    },
  })
}
