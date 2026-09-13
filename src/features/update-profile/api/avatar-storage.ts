import { supabase } from "@shared/api/supabase-client"

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024
export const AVATAR_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
}
const AVATAR_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

export type AvatarValidationCode = "invalid-type" | "too-large"

export class AvatarValidationError extends Error {
  constructor(readonly code: AvatarValidationCode) {
    super(code)
    this.name = "AvatarValidationError"
  }
}

export interface StagedAvatar {
  path: string
  url: string
}

export async function stageAvatar(file: File): Promise<StagedAvatar> {
  const extension = AVATAR_EXTENSIONS[file.type as keyof typeof AVATAR_EXTENSIONS]
  if (!extension) throw new AvatarValidationError("invalid-type")
  if (file.size > MAX_AVATAR_BYTES) throw new AvatarValidationError("too-large")

  const path = `profile/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from("avatars").getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function removeStagedAvatar(path: string) {
  const { error } = await supabase.storage.from("avatars").remove([path])
  if (error) throw error
}
