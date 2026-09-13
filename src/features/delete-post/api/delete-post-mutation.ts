import { postKeys } from "@entities/post/api/post-keys"
import { supabase } from "@shared/api/supabase-client"
import { useT } from "@shared/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

async function deletePost(id: string) {
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()
  if (error) throw error
  if (!data || data.id !== id) throw new Error("The post could not be deleted.")
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
      toast.success(t.toast.postDeleted)
    },
    onError: () => {
      toast.error(t.toast.error)
    },
  })
}
