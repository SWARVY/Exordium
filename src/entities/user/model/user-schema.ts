import * as v from "valibot"

export const UserRoleSchema = v.picklist(["owner", "user"])
export type UserRole = v.InferOutput<typeof UserRoleSchema>

export const UserSchema = v.object({
  id: v.string(),
  email: v.nullable(v.string()),
  name: v.nullable(v.string()),
  avatarUrl: v.nullable(v.string()),
  githubLogin: v.nullable(v.string()),
  role: UserRoleSchema,
})

export type User = v.InferOutput<typeof UserSchema>
