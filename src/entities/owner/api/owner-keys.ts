export const ownerKeys = {
  all: ["owner"] as const,
  profile: () => [...ownerKeys.all, "profile"] as const,
}
