import { reactionKeys } from "@entities/reaction"
import { supabase } from "@shared/api/supabase-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ReactionEmoji, ReactionSummary } from "@entities/reaction"

async function togglePostReaction({
  postId,
  emoji,
  userId,
  reacted,
}: {
  postId: string
  emoji: ReactionEmoji
  userId: string
  reacted: boolean
}) {
  if (reacted) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from("post_reactions")
      .insert({ post_id: postId, user_id: userId, emoji })
    if (error) throw error
  }
}

export function useTogglePostReaction(postId: string, userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ emoji, reacted }: { emoji: ReactionEmoji; reacted: boolean }) => {
      if (!userId) throw new Error("로그인이 필요합니다")
      return togglePostReaction({ postId, emoji, userId, reacted })
    },
    onMutate: async ({ emoji, reacted }) => {
      const queryKey = reactionKeys.byPost(postId)
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<ReactionSummary>(queryKey)
      queryClient.setQueryData<ReactionSummary>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          [emoji]: {
            count: reacted ? old[emoji].count - 1 : old[emoji].count + 1,
            reacted: !reacted,
          },
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(reactionKeys.byPost(postId), ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reactionKeys.byPost(postId) })
    },
  })
}

async function toggleCommentReaction({
  commentId,
  emoji,
  userId,
  reacted,
}: {
  commentId: string
  emoji: ReactionEmoji
  userId: string
  reacted: boolean
}) {
  if (reacted) {
    const { error } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from("comment_reactions")
      .insert({ comment_id: commentId, user_id: userId, emoji })
    if (error) throw error
  }
}

export function useToggleCommentReaction(commentId: string, userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ emoji, reacted }: { emoji: ReactionEmoji; reacted: boolean }) => {
      if (!userId) throw new Error("로그인이 필요합니다")
      return toggleCommentReaction({ commentId, emoji, userId, reacted })
    },
    onMutate: async ({ emoji, reacted }) => {
      const queryKey = reactionKeys.byComment(commentId)
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<ReactionSummary>(queryKey)
      queryClient.setQueryData<ReactionSummary>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          [emoji]: {
            count: reacted ? old[emoji].count - 1 : old[emoji].count + 1,
            reacted: !reacted,
          },
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(reactionKeys.byComment(commentId), ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reactionKeys.byComment(commentId) })
    },
  })
}
