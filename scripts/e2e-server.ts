import { spawn } from "node:child_process"

import { appUrl, getLocalStack, localEnvironment, projectRoot } from "./local-stack.ts"

const stack = getLocalStack()
const environment = {
  ...localEnvironment(),
  NODE_ENV: "production",
  VITE_SUPABASE_URL: stack.url,
  VITE_SUPABASE_PUBLISHABLE_KEY: stack.publishableKey,
  VITE_SITE_URL: appUrl,
}

async function run(binary: string, args: string[]) {
  const child = spawn(binary, args, { cwd: projectRoot, env: environment, stdio: "inherit" })
  const stop = () => child.kill("SIGTERM")
  process.once("SIGTERM", stop)
  process.once("SIGINT", stop)
  const code = await new Promise<number>((resolve, reject) => {
    child.once("error", reject)
    child.once("exit", (exitCode) => resolve(exitCode ?? 1))
  })
  process.removeListener("SIGTERM", stop)
  process.removeListener("SIGINT", stop)
  if (code !== 0) process.exit(code)
}

await run("node_modules/.bin/vite", ["build", "--mode", "e2e"])
await run("node_modules/.bin/srvx", [
  "serve",
  "--prod",
  "--dir",
  ".",
  "--entry",
  "dist-e2e/server/server.js",
  "--static",
  "dist-e2e/client",
  "--host",
  "127.0.0.1",
  "--port",
  "4317",
])
