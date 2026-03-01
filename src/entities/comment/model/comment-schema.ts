import * as v from "valibot"

export const CommentSchema = v.object({
  id: v.string(),
  postId: v.string(),
  parentId: v.nullable(v.string()),
  authorId: v.string(),
  authorName: v.string(),
  authorAvatarUrl: v.nullable(v.string()),
  content: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
  createdAt: v.string(),
  updatedAt: v.string(),
})

export const CommentContentSchema = v.object({
  content: v.pipe(
    v.string(),
    v.minLength(1, "댓글을 입력하세요"),
    v.maxLength(1000, "댓글은 1000자 이내로 입력하세요"),
  ),
})

export const CreateCommentSchema = v.object({
  content: v.pipe(
    v.string(),
    v.minLength(1, "댓글을 입력하세요"),
    v.maxLength(1000, "댓글은 1000자 이내로 입력하세요"),
  ),
  parentId: v.optional(v.string()),
})

export type Comment = v.InferOutput<typeof CommentSchema>
export type CreateComment = v.InferOutput<typeof CreateCommentSchema>
