export const reactionKeys = {
  all: ["reactions"] as const,
  byPost: (postId: string) => [...reactionKeys.all, "post", postId] as const,
  byComment: (commentId: string) => [...reactionKeys.all, "comment", commentId] as const,
}
