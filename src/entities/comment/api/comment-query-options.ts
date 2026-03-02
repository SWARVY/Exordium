import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { commentKeys } from "./comment-keys"

import type { Comment } from "../model/comment-schema"

function mapRow(row: Record<string, unknown>): Comment {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    parentId: (row.parent_id as string | null) ?? null,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    authorAvatarUrl: (row.author_avatar_url as string | null) ?? null,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

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
        return (data ?? []).map(mapRow)
      },
    }),
}
