import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { userKeys } from "./user-keys"

import type { User } from "../model/user-schema"

export const userQueryOptions = {
  currentUser: () =>
    queryOptions({
      queryKey: userKeys.currentUser(),
      queryFn: async () => {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error || !user) return null
        const githubLogin = user.user_metadata?.user_name ?? null
        return {
          id: user.id,
          email: user.email ?? null,
          name: user.user_metadata?.full_name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
          githubLogin,
          role: user.app_metadata?.role === "owner" ? "owner" : "user",
        } satisfies User
      },
    }),
}
