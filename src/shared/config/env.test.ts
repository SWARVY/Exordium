import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co")
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "")
})

afterEach(() => vi.unstubAllEnvs())

describe("Supabase public key configuration", () => {
  it("starts with only the publishable key configured", async () => {
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test")
    const { env } = await import("./env")
    expect(env.supabase.publishableKey).toBe("sb_publishable_test")
  })

  it("keeps existing deployments using the legacy variable working", async () => {
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "legacy-anon-test")
    const { env } = await import("./env")
    expect(env.supabase.publishableKey).toBe("legacy-anon-test")
  })

  it("prefers the new variable when both are configured", async () => {
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test")
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "legacy-anon-test")
    const { env } = await import("./env")
    expect(env.supabase.publishableKey).toBe("sb_publishable_test")
  })

  it("reports the new variable name when neither key is configured", async () => {
    await expect(import("./env")).rejects.toThrow(
      "Missing required environment variable: VITE_SUPABASE_PUBLISHABLE_KEY",
    )
  })
})
