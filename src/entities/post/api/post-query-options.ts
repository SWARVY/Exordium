import { supabase } from "@shared/api/supabase-client"
import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query"

import { postKeys } from "./post-keys"

import type { Post } from "../model/post-schema"

const PAGE_SIZE = 10

export const postQueryOptions = {
  list: (filters?: { tag?: string }) =>
    infiniteQueryOptions({
      queryKey: postKeys.list(filters),
      queryFn: async ({ pageParam = 0 }) => {
        let query = supabase
          .from("posts")
          .select("*")
          .order("published_at", { ascending: false })
          .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)

        if (filters?.tag) {
          query = query.contains("tags", [filters.tag])
        }

        const { data, error } = await query
        if (error) throw error
        return data as Post[]
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: postKeys.detail(slug),
      queryFn: async () => {
        const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).single()
        if (error) throw error
        return data as Post
      },
    }),

  search: (q: string) =>
    queryOptions({
      queryKey: postKeys.search(q),
      queryFn: async () => {
        if (!q.trim()) return [] as Post[]
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .not("published_at", "is", null)
          .order("published_at", { ascending: false })
          .limit(20)
        if (error) throw error
        return data as Post[]
      },
      enabled: q.trim().length > 0,
    }),
}
