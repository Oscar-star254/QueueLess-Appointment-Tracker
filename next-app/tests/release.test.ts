import test from "node:test"
import assert from "node:assert/strict"
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"

const urls =
  "DATABASE_URL=postgresql://example/runtime\nDIRECT_URL=postgresql://example/direct\n"

function runRelease(args: string[], file: string | null = urls, exitCode = 0) {
  const directory = mkdtempSync(path.join(tmpdir(), "fundifind-release-"))
  try {
    mkdirSync(path.join(directory, "scripts"))
    mkdirSync(path.join(directory, "bin"))
    copyFileSync(
      "scripts/release.mjs",
      path.join(directory, "scripts/release.mjs"),
    )
    if (file !== null)
      writeFileSync(path.join(directory, ".env.production.local"), file)
    // Stub pnpm: these tests must never migrate or seed a real database.
    writeFileSync(
      path.join(directory, "bin/pnpm"),
      `#!/usr/bin/env node
console.log(JSON.stringify({ args: process.argv.slice(2), production: process.env.NODE_ENV === "production", runtimeLoaded: process.env.DATABASE_URL === "postgresql://example/runtime", directLoaded: process.env.DIRECT_URL === "postgresql://example/direct", cwdMatches: process.cwd() === ${JSON.stringify(directory)} }))
process.exit(${exitCode})
`,
      { mode: 0o700 },
    )
    const env = { ...process.env }
    delete env.DATABASE_URL
    delete env.DIRECT_URL
    return spawnSync(
      process.execPath,
      [path.join(directory, "scripts/release.mjs"), ...args],
      {
        encoding: "utf8",
        env: {
          ...env,
          NODE_ENV: "development",
          PATH: `${path.join(directory, "bin")}${path.delimiter}${env.PATH}`,
        },
      },
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

for (const action of ["db:deploy", "db:seed:production"]) {
  test(`production release loads the protected file for ${action}`, () => {
    const result = runRelease([action])
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), {
      args: [action],
      production: true,
      runtimeLoaded: true,
      directLoaded: true,
      cwdMatches: true,
    })
  })
}

test("production release refuses development seeds, unknown commands, and extra arguments", () => {
  for (const args of [
    [],
    ["db:seed"],
    ["db:migrate"],
    ["build"],
    ["db:deploy", "extra"],
  ]) {
    const result = runRelease(args)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Usage:/)
    assert.equal(result.stdout, "")
  }
})

test("production release requires its protected environment file", () => {
  const result = runRelease(["db:deploy"], null)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Cannot load/)
  assert.equal(result.stdout, "")
})

test("production release requires both database URLs without printing credentials", () => {
  for (const file of [
    "",
    "DATABASE_URL=private-placeholder\n",
    "DIRECT_URL=private-placeholder\n",
  ]) {
    const result = runRelease(["db:deploy"], file)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Configure DATABASE_URL and DIRECT_URL/)
    assert.doesNotMatch(result.stderr, /private-placeholder/)
    assert.equal(result.stdout, "")
  }
})

test("production release propagates a failed migration exit status", () => {
  assert.equal(runRelease(["db:deploy"], urls, 7).status, 7)
})
