import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { REACTION_EMOJIS } from "../model/reaction-schema"
import { reactionKeys } from "./reaction-keys"

import type { ReactionSummary } from "../model/reaction-schema"

function buildSummary(
  rows: { emoji: string; user_id: string }[],
  currentUserId: string | undefined,
): ReactionSummary {
  const summary = {} as ReactionSummary
  for (const emoji of REACTION_EMOJIS) {
    const matching = rows.filter((r) => r.emoji === emoji)
    summary[emoji] = {
      count: matching.length,
      reacted: currentUserId ? matching.some((r) => r.user_id === currentUserId) : false,
    }
  }
  return summary
}

export const reactionQueryOptions = {
  byPost: (postId: string, currentUserId?: string) =>
    queryOptions({
      queryKey: reactionKeys.byPost(postId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("post_reactions")
          .select("emoji, user_id")
          .eq("post_id", postId)
        if (error) throw error
        return buildSummary(data as { emoji: string; user_id: string }[], currentUserId)
      },
    }),

  byComment: (commentId: string, currentUserId?: string) =>
    queryOptions({
      queryKey: reactionKeys.byComment(commentId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("comment_reactions")
          .select("emoji, user_id")
          .eq("comment_id", commentId)
        if (error) throw error
        return buildSummary(data as { emoji: string; user_id: string }[], currentUserId)
      },
    }),
}
