import * as v from "valibot"

export const PostSchema = v.object({
  id: v.string(),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  content: v.string(),
  coverImage: v.nullable(v.string()),
  tags: v.array(v.string()),
  publishedAt: v.nullable(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
})

export const PostDraftSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "제목을 입력하세요")),
  description: v.pipe(v.string(), v.minLength(1, "요약을 입력하세요")),
  content: v.string(),
  coverImage: v.string(),
  tags: v.array(v.string()),
  slug: v.pipe(
    v.string(),
    v.minLength(1, "슬러그를 입력하세요"),
    v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "슬러그는 소문자, 숫자, 하이픈만 허용됩니다"),
  ),
})

export type Post = v.InferOutput<typeof PostSchema>
export type PostDraft = v.InferOutput<typeof PostDraftSchema>
