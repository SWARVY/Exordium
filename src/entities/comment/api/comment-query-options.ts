import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { commentKeys } from "./comment-keys"

import type { Comment } from "../model/comment-schema"

export const commentQueryOptions = {
  byPost: (postId: string) =>
    queryOptions({
      queryKey: commentKeys.byPost(postId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true })
        if (error) throw error
        return data as Comment[]
      },
    }),
}
