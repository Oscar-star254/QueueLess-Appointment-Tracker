import { loadEnvFile } from "node:process"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const action = process.argv[2]
const allowed = ["db:deploy", "db:seed:production"]
if (!allowed.includes(action) || process.argv.length !== 3) {
  console.error("Usage: pnpm release:production <db:deploy|db:seed:production>")
  process.exit(1)
}

const cwd = fileURLToPath(new URL("../", import.meta.url))
try {
  loadEnvFile(
    fileURLToPath(new URL("../.env.production.local", import.meta.url)),
  )
} catch {
  console.error(
    "Cannot load next-app/.env.production.local. Pull the intended Vercel production environment first.",
  )
  process.exit(1)
}
if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error(
    "Configure DATABASE_URL and DIRECT_URL for the intended production database.",
  )
  process.exit(1)
}

// Never print environment values or fall back to the development seed command.
const result = spawnSync("pnpm", [action], {
  cwd,
  env: { ...process.env, NODE_ENV: "production" },
  stdio: "inherit",
})
if (result.error)
  console.error(
    "Could not start the release command. Check that pnpm is installed.",
  )
process.exitCode = result.status ?? 1
