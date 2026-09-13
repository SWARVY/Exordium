function requireEnv(key: string, fallbackKey?: string): string {
  const value = import.meta.env[key] || (fallbackKey && import.meta.env[fallbackKey])
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  supabase: {
    url: requireEnv("VITE_SUPABASE_URL"),
    publishableKey: requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_ANON_KEY"),
  },
  site: {
    url: import.meta.env.VITE_SITE_URL ?? "https://forimaginary.dev",
  },
} as const
