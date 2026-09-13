import { spawnSync } from "node:child_process"

import {
  assertLocalProject,
  ensureLocalNetwork,
  getLocalStack,
  localEnvironment,
  localNetwork,
  projectRoot,
  supabaseCli,
} from "./local-stack.ts"

const commands: Record<string, string[]> = {
  start: ["start"],
  stop: ["stop", "--project-id", "exordium-e2e"],
  reset: ["db", "reset", "--local"],
}

assertLocalProject()
const command = process.argv[2]
if (command === "status") {
  const stack = getLocalStack()
  console.log(`Local API: ${stack.url}\nStudio: http://127.0.0.1:54323`)
} else if (Object.hasOwn(commands, command) && process.argv.length === 3) {
  if (command === "start" || command === "reset") ensureLocalNetwork()
  const result = spawnSync(supabaseCli, [...commands[command], "--network-id", localNetwork], {
    cwd: projectRoot,
    env: localEnvironment(),
    stdio: "inherit",
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} else {
  throw new Error("Use start, stop, reset, or status. Remote commands are not supported.")
}
