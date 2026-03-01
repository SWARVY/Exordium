function requireEnv(key: string): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  supabase: {
    url: requireEnv("VITE_SUPABASE_URL"),
    anonKey: requireEnv("VITE_SUPABASE_ANON_KEY"),
  },
  site: {
    url: import.meta.env.VITE_SITE_URL ?? "https://forimaginary.dev",
  },
} as const
