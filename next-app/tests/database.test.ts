import test from "node:test"
import assert from "node:assert/strict"
import { randomBytes, randomInt } from "node:crypto"

// Opt-in: use a disposable database with both migrations applied, never production.
test(
  "database registration, email verification, reset, and token replay protection",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    assert.ok(process.env.DATABASE_URL, "Configure a disposable DATABASE_URL")
    process.env.NEXTAUTH_URL ||= "http://localhost:3000"
    process.env.NEXTAUTH_SECRET ||= randomBytes(32).toString("hex")
    process.env.EMAIL_TRANSPORT = "test-outbox" // Keep local tokens in the outbox, not stdout.
    delete process.env.SMTP_HOST
    const { db } = await import("../lib/db")
    const { POST } = await import("../app/api/account/[action]/route")
    const { compare } = await import("bcryptjs")
    const email = `integration-${randomBytes(8).toString("hex")}@example.com`
    const phone = `2547${String(randomInt(10000000, 99999999))}`
    const password = "test-only-original-password"
    const send = (action: string, body: unknown) =>
      POST(
        new Request(`${process.env.NEXTAUTH_URL}/api/account/${action}`, {
          method: "POST",
          headers: {
            origin: new URL(process.env.NEXTAUTH_URL!).origin,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
        { params: Promise.resolve({ action }) },
      )
    try {
      assert.equal(
        (
          await send("register", {
            name: "Test Provider",
            email,
            phone,
            password,
            consent: "on",
            website: "",
            role: "SUPER_ADMIN",
          })
        ).status,
        400,
      )
      assert.equal(
        (
          await send("register", {
            name: "Test Provider",
            email,
            phone,
            password,
            consent: "on",
            website: "",
          })
        ).status,
        200,
      )
      const user = await db.user.findUniqueOrThrow({
        where: { email },
        include: { profile: true },
      })
      assert.equal(user.role, "PROVIDER")
      assert.equal(user.phone, phone)
      assert.ok(user.profile?.consentAt)
      assert.ok(await compare(password, user.passwordHash))
      const emailDelivery = await db.delivery.findFirstOrThrow({
        where: { recipient: email },
        orderBy: { createdAt: "desc" },
      })
      const token = emailDelivery.body.match(/token=([a-f0-9]{64})/)![1]
      const concurrent = await Promise.all([
        send("verify-email", { token }),
        send("verify-email", { token }),
      ])
      assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 400])
      assert.ok(
        (await db.user.findUniqueOrThrow({ where: { email } })).emailVerified,
      )
      assert.equal((await send("forgot-password", { email })).status, 200)
      const resetDelivery = await db.delivery.findFirstOrThrow({
        where: { recipient: email, subject: "Reset your FundiFind password" },
        orderBy: { createdAt: "desc" },
      })
      const resetToken = resetDelivery.body.match(/token=([a-f0-9]{64})/)![1]
      assert.equal(
        (
          await send("reset-password", {
            token: resetToken,
            password: "test-only-new-password",
          })
        ).status,
        200,
      )
      assert.equal(
        (
          await send("reset-password", {
            token: resetToken,
            password: "test-only-new-password",
          })
        ).status,
        400,
      )
      const updated = await db.user.findUniqueOrThrow({ where: { email } })
      assert.equal(updated.sessionVersion, user.sessionVersion + 1)
      assert.ok(await compare("test-only-new-password", updated.passwordHash))
      const { rateLimit } = await import("../lib/security")
      const key = randomBytes(8).toString("hex")
      const attempts = await Promise.allSettled(
        Array.from({ length: 8 }, () => rateLimit("integration", key, 3)),
      )
      assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 3)
      const csrf = await POST(
        new Request(`${process.env.NEXTAUTH_URL}/api/account/register`, {
          method: "POST",
          headers: {
            origin: "https://evil.example",
            "Content-Type": "application/json",
          },
          body: "{}",
        }),
        { params: Promise.resolve({ action: "register" }) },
      )
      assert.equal(csrf.status, 403)
    } finally {
      const user = await db.user.findUnique({ where: { email } })
      if (user) {
        await db.auditLog.deleteMany({ where: { actorId: user.id } })
        await db.user.delete({ where: { id: user.id } })
      }
      await db.delivery.deleteMany({ where: { recipient: email } })
      await db.$disconnect()
    }
  },
)
