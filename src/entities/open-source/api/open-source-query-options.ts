import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { openSourceKeys } from "./open-source-keys"

import type { OpenSource } from "../model/open-source-schema"

export const openSourceQueryOptions = {
  list: () =>
    queryOptions({
      queryKey: openSourceKeys.lists(),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("open_source")
          .select("*")
          .order("order", { ascending: true })
        if (error) throw error
        return data as OpenSource[]
      },
    }),

  search: (q: string) =>
    queryOptions({
      queryKey: openSourceKeys.search(q),
      queryFn: async () => {
        if (!q.trim()) return [] as OpenSource[]
        const { data, error } = await supabase
          .from("open_source")
          .select("*")
          .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
          .order("order", { ascending: true })
          .limit(20)
        if (error) throw error
        return data as OpenSource[]
      },
      enabled: q.trim().length > 0,
    }),
}
