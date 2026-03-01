export const openSourceKeys = {
  all: ["open-source"] as const,
  lists: () => [...openSourceKeys.all, "list"] as const,
  searches: () => [...openSourceKeys.all, "search"] as const,
  search: (q: string) => [...openSourceKeys.searches(), q] as const,
}
