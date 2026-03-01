import type { ImageUploadAdapter } from "@jikjo/image"

import { supabase } from "./supabase-client"

export const postImageUploadAdapter: ImageUploadAdapter = {
  upload: async (file: File) => {
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { upsert: false })

    if (error) throw error

    const { data } = supabase.storage.from("post-images").getPublicUrl(path)
    return data.publicUrl
  },
}
