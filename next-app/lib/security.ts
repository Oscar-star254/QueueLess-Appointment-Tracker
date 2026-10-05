import { createHash, createHmac } from "node:crypto"
import { db } from "./db"
import { NextResponse } from "next/server"
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export function digest(value: string) {
  return createHash("sha256").update(value).digest("hex")
}
export function secretDigest(value: string) {
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32)
    throw new Error("Configure NEXTAUTH_SECRET with at least 32 characters.")
  return createHmac("sha256", process.env.NEXTAUTH_SECRET)
    .update(value)
    .digest("hex")
}
export function requestIdentity(headers: Headers): string {
  // Only enable when the deployment edge overwrites this header (never on a public VPS origin).
  return process.env.TRUST_PROXY === "true"
    ? secretDigest(
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      )
    : "shared-untrusted-edge"
}
export async function rateLimit(
  scope: string,
  identity: string,
  limit: number,
  seconds = 900,
) {
  const key = digest(`${scope}:${identity}`)
  // One atomic UPSERT: safe across processes and serverless instances.
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, NOW() + ${seconds} * INTERVAL '1 second', NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN NOW() + ${seconds} * INTERVAL '1 second' ELSE "RateLimit"."resetAt" END,
      "updatedAt" = NOW()
    RETURNING "count"`
  if (rows[0].count > limit)
    throw new HttpError(
      429,
      "Too many attempts. Please try again in 15 minutes.",
    )
}
export function assertTrustedOrigin(request: Request) {
  const expected = process.env.NEXTAUTH_URL
  if (!expected || request.headers.get("origin") !== new URL(expected).origin)
    throw new HttpError(403, "Request origin not allowed.")
}
export function assertSameOrigin(request: Request) {
  assertTrustedOrigin(request)
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Use application/json.")
}
export async function readBody(request: Request): Promise<unknown> {
  const declaredSize = Number(request.headers.get("content-length") || 0)
  if (declaredSize > 8192) throw new HttpError(413, "Request is too large.")
  const reader = request.body?.getReader()
  if (!reader) throw new HttpError(400, "Request body is required.")
  const chunks: Uint8Array[] = []
  let length = 0
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > 8192) {
      await reader.cancel()
      throw new HttpError(413, "Request is too large.")
    }
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw new HttpError(400, "Invalid JSON.")
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json({ error: error.message }, {
      status: error.status,
      headers: error.status === 429 ? { "Retry-After": "900" } : undefined,
    })
  // Never return database details or credentials to the browser.
  return NextResponse.json(
    { error: "Something went wrong. Please try again later." },
    { status: 500 },
  )
}
