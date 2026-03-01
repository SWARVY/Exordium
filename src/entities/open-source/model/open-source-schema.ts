import * as v from "valibot"

export const OpenSourceSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  repoUrl: v.pipe(v.string(), v.url("올바른 URL을 입력하세요")),
  language: v.nullable(v.string()),
  order: v.number(),
  createdAt: v.string(),
  updatedAt: v.string(),
})

export const OpenSourceFormSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "이름을 입력하세요")),
  description: v.pipe(v.string(), v.minLength(1, "설명을 입력하세요")),
  repoUrl: v.pipe(v.string(), v.url("올바른 URL을 입력하세요")),
  language: v.string(),
})

export type OpenSource = v.InferOutput<typeof OpenSourceSchema>
export type OpenSourceForm = v.InferOutput<typeof OpenSourceFormSchema>
