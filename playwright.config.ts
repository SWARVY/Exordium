import { defineConfig, devices } from "@playwright/test"

import { appUrl } from "./scripts/local-stack"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: appUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium" } }],
  webServer: {
    command: "bun --no-env-file scripts/e2e-server.ts",
    url: appUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
