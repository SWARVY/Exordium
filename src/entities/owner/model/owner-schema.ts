import * as v from "valibot"

export const OwnerProfileSchema = v.object({
  id: v.string(),
  name: v.string(),
  bio: v.string(),
  avatarUrl: v.nullable(v.string()),
  githubUrl: v.nullable(v.string()),
  twitterUrl: v.nullable(v.string()),
  websiteUrl: v.nullable(v.string()),
  skills: v.array(v.string()),
})

export const OwnerProfileFormSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "이름을 입력하세요")),
  bio: v.pipe(v.string(), v.minLength(1, "소개를 입력하세요"), v.maxLength(500)),
  avatarUrl: v.nullable(v.string()),
  githubUrl: v.union([v.literal(""), v.pipe(v.string(), v.url())]),
  twitterUrl: v.union([v.literal(""), v.pipe(v.string(), v.url())]),
  websiteUrl: v.union([v.literal(""), v.pipe(v.string(), v.url())]),
  skills: v.array(v.string()),
})

export type OwnerProfile = v.InferOutput<typeof OwnerProfileSchema>
export type OwnerProfileForm = v.InferOutput<typeof OwnerProfileFormSchema>
