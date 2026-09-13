export const reactionKeys = {
  all: ["reactions"] as const,
  post: (postId: string) => [...reactionKeys.all, "post", postId] as const,
  byPost: (postId: string, currentUserId?: string) =>
    [...reactionKeys.post(postId), "viewer", currentUserId ?? null] as const,
  comment: (commentId: string) => [...reactionKeys.all, "comment", commentId] as const,
  byComment: (commentId: string, currentUserId?: string) =>
    [...reactionKeys.comment(commentId), "viewer", currentUserId ?? null] as const,
}
