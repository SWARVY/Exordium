import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export const projectRoot = fileURLToPath(new URL("../", import.meta.url))
export const supabaseCli = join(projectRoot, "node_modules/.bin/supabase")
export const appUrl = "http://127.0.0.1:4317"
export const localNetwork = "exordium-e2e-local"

export function localEnvironment() {
  const environment = { ...process.env }
  for (const key of Object.keys(environment)) {
    if (/^(VITE_|SUPABASE_)/.test(key)) delete environment[key]
  }
  const socket = join(homedir(), ".colima/exordium/docker.sock")
  if (existsSync(socket)) {
    environment.DOCKER_HOST = `unix://${socket}`
    delete environment.DOCKER_CONTEXT
  }
  return environment
}

export function assertLocalProject() {
  const config = readFileSync(join(projectRoot, "supabase/config.toml"), "utf8")
  if (!/^project_id = "exordium-e2e"$/m.test(config)) {
    throw new Error("Expected the dedicated exordium-e2e local Supabase project.")
  }
}

export function ensureLocalNetwork() {
  const options = { env: localEnvironment(), encoding: "utf8" as const }
  const networks = execFileSync("docker", ["network", "ls", "--format", "{{.Name}}"], options)
  const bindingOption = "com.docker.network.bridge.host_binding_ipv4"
  if (!networks.trim().split("\n").includes(localNetwork)) {
    execFileSync(
      "docker",
      [
        "network",
        "create",
        "--driver",
        "bridge",
        "--opt",
        `${bindingOption}=127.0.0.1`,
        localNetwork,
      ],
      options,
    )
  }
  const binding = execFileSync(
    "docker",
    ["network", "inspect", localNetwork, "--format", `{{index .Options "${bindingOption}"}}`],
    options,
  ).trim()
  if (binding !== "127.0.0.1") throw new Error("The E2E network must bind only to localhost.")
}

export function getLocalStack() {
  assertLocalProject()
  const raw = execFileSync(supabaseCli, ["status", "-o", "json"], {
    cwd: projectRoot,
    env: localEnvironment(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
  const status = JSON.parse(raw) as Record<string, unknown>
  if (status.API_URL !== "http://127.0.0.1:54321") {
    throw new Error("Tests require Supabase at http://127.0.0.1:54321. Remote URLs are refused.")
  }
  const publishableKey = status.PUBLISHABLE_KEY || status.ANON_KEY
  if (typeof publishableKey !== "string" || typeof status.SERVICE_ROLE_KEY !== "string") {
    throw new Error("Local Supabase credentials are missing. Run bun run db:start first.")
  }
  return {
    url: status.API_URL,
    publishableKey,
    serviceRoleKey: status.SERVICE_ROLE_KEY,
  }
}
