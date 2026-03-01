export const userKeys = {
  all: ["users"] as const,
  currentUser: () => [...userKeys.all, "current"] as const,
}
