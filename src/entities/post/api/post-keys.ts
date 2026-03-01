export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (slug: string) => [...postKeys.details(), slug] as const,
  drafts: () => [...postKeys.all, "draft"] as const,
  draft: (id: string) => [...postKeys.drafts(), id] as const,
  searches: () => [...postKeys.all, "search"] as const,
  search: (q: string) => [...postKeys.searches(), q] as const,
}
