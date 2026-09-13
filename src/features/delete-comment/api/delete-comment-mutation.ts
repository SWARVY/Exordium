import { commentKeys } from "@entities/comment/api/comment-keys"
import { supabase } from "@shared/api/supabase-client"
import { useT } from "@shared/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

async function deleteComment({ id, postId }: { id: string; postId: string }) {
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()
  if (error) throw error
  if (!data || data.id !== id) throw new Error("댓글을 삭제할 수 없습니다.")
  return postId
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: (id: string) => deleteComment({ id, postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) })
      toast.success(t.toast.commentDeleted)
    },
    onError: () => {
      toast.error(t.toast.error)
    },
  })
}
