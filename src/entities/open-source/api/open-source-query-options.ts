import { supabase } from "@shared/api/supabase-client"
import { queryOptions } from "@tanstack/react-query"

import { openSourceKeys } from "./open-source-keys"

import type { OpenSource } from "../model/open-source-schema"

function mapRow(row: Record<string, unknown>): OpenSource {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    repoUrl: row.repo_url as string,
    language: (row.language as string | null) ?? null,
    order: row.order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

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
        return (data ?? []).map(mapRow)
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
        return (data ?? []).map(mapRow)
      },
      enabled: q.trim().length > 0,
    }),
}
