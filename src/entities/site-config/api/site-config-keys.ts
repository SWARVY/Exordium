export const siteConfigKeys = {
  all: ["site-config"] as const,
  config: () => [...siteConfigKeys.all, "config"] as const,
}
