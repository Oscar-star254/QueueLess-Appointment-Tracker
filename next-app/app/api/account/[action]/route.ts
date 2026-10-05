import { NextResponse } from "next/server"
import { randomBytes, randomInt } from "node:crypto"
import { hash } from "bcryptjs"
import { Prisma, TokenPurpose } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  registerSchema,
  emailSchema,
  tokenSchema,
  passwordSchema,
} from "@/lib/validation"
import {
  apiError,
  assertSameOrigin,
  digest,
  HttpError,
  rateLimit,
  readBody,
  requestIdentity,
  secretDigest,
} from "@/lib/security"
import { requireActor } from "@/lib/authorization"
import { deliver } from "@/lib/delivery"

export const runtime = "nodejs"
const honeypot = { website: z.string().max(0).optional() }
const actions = z.enum([
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "resend-verification",
  "send-otp",
  "verify-phone",
])
async function issue(
  tx: Prisma.TransactionClient,
  user: {
    id: string
    email: string
    phone: string
  },
  purpose: TokenPurpose,
) {
  // Serialize issuance per user so concurrent resends cannot leave two valid codes.
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`
  const phone = purpose === "PHONE_VERIFY"
  const raw = phone
    ? String(randomInt(100000, 1000000))
    : randomBytes(32).toString("hex")
  const tokenHash = phone ? secretDigest(`${user.id}:${raw}`) : digest(raw)
  await tx.otpCode.updateMany({
    where: { userId: user.id, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  })
  await tx.otpCode.create({
    data: {
      userId: user.id,
      purpose,
      tokenHash,
      expiresAt: new Date(
        Date.now() +
          (phone ? 10 : purpose === "PASSWORD_RESET" ? 30 : 1440) * 60000,
      ),
    },
  })
  const path = purpose === "PASSWORD_RESET" ? "reset-password" : "verify-email"
  const link = `${process.env.NEXTAUTH_URL}/${path}?token=${raw}`
  return tx.delivery.create({
    data: {
      channel: phone ? "sms" : "email",
      recipient: phone ? user.phone : user.email,
      subject:
        purpose === "PASSWORD_RESET"
          ? "Reset your FundiFind password"
          : "Verify your FundiFind email",
      body: phone
        ? `Your FundiFind code is ${raw}. It expires in 10 minutes. Do not share this code.`
        : `Visit ${link} to ${
            purpose === "PASSWORD_RESET"
              ? "reset your password (expires in 30 minutes)"
              : "verify your email (expires in 24 hours)"
          }. If you did not request this, ignore this message.`,
    },
  })
}
async function consume(
  tx: Prisma.TransactionClient,
  tokenHash: string,
  purpose: TokenPurpose,
  userId?: string,
) {
  const code = await tx.otpCode.findUnique({ where: { tokenHash } })
  if (
    !code ||
    code.purpose !== purpose ||
    (userId && code.userId !== userId) ||
    code.consumedAt ||
    code.expiresAt <= new Date()
  )
    throw new HttpError(
      400,
      "This code or link is invalid or has expired. Request a new one.",
    )
  const changed = await tx.otpCode.updateMany({
    where: { id: code.id, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  })
  if (changed.count !== 1)
    throw new HttpError(400, "This code or link has already been used.")
  return code.userId
}
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  try {
    assertSameOrigin(request)
    const action = actions.safeParse((await context.params).action)
    if (!action.success) throw new HttpError(404, "Not found.")
    await rateLimit(
      `account-edge:${action.data}`,
      requestIdentity(request.headers),
      process.env.TRUST_PROXY === "true" ? 20 : 500,
    )
    const body = await readBody(request)
    const parse = <T>(schema: z.ZodType<T>): T => {
      const result = schema.safeParse(body)
      if (!result.success)
        throw new HttpError(
          400,
          result.error.issues[0]?.message || "Check your input.",
        )
      return result.data
    }
    let deliveryId: string | undefined
    let message = "Request accepted."
    if (action.data === "register") {
      const data = parse(registerSchema)
      await rateLimit("register-email", data.email, 3)
      const passwordHash = await hash(data.password, 12)
      try {
        const delivery = await db.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name: data.name,
              email: data.email,
              phone: data.phone,
              passwordHash,
              role: "PROVIDER",
              profile: { create: { consentAt: new Date() } },
            },
          })
          await tx.auditLog.create({
            data: {
              actorId: user.id,
              action: "AUTH_REGISTER",
              targetType: "User",
              targetId: user.id,
              ipHash: requestIdentity(request.headers),
            },
          })
          return issue(tx, user, "EMAIL_VERIFY")
        })
        deliveryId = delivery.id
      } catch (error) {
        if (
          !(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          )
        )
          throw error
        // Same response for existing accounts; avoid exposing registered contacts.
      }
      message =
        "If those details are available, your account is ready. Check your email for the verification link, then sign in."
    } else if (action.data === "forgot-password") {
      const { email } = parse(
        z.object({ email: emailSchema, ...honeypot }).strict(),
      )
      await rateLimit("reset-email", email, 3)
      const user = await db.user.findUnique({ where: { email } })
      if (user && !user.suspendedAt) {
        const delivery = await db.$transaction((tx) =>
          issue(tx, user, "PASSWORD_RESET"),
        )
        deliveryId = delivery.id
      }
      message =
        "If an account exists for that email, a password reset link has been requested."
    } else if (action.data === "reset-password") {
      const { token, password } = parse(
        z
          .object({ token: tokenSchema, password: passwordSchema, ...honeypot })
          .strict(),
      )
      const passwordHash = await hash(password, 12)
      await db.$transaction(async (tx) => {
        const userId = await consume(tx, digest(token), "PASSWORD_RESET")
        await tx.user.update({
          where: { id: userId },
          data: { passwordHash, sessionVersion: { increment: 1 } },
        })
        await tx.otpCode.updateMany({
          where: { userId, purpose: "PASSWORD_RESET", consumedAt: null },
          data: { consumedAt: new Date() },
        })
        await tx.auditLog.create({
          data: {
            actorId: userId,
            action: "AUTH_PASSWORD_RESET",
            targetType: "User",
            targetId: userId,
          },
        })
      })
      message =
        "Password updated. All previous sessions are revoked. Sign in with your new password."
    } else if (action.data === "verify-email") {
      const { token } = parse(
        z.object({ token: tokenSchema, ...honeypot }).strict(),
      )
      await db.$transaction(async (tx) => {
        const userId = await consume(tx, digest(token), "EMAIL_VERIFY")
        await tx.user.update({
          where: { id: userId },
          data: { emailVerified: new Date() },
        })
      })
      message = "Email verified. You can now sign in to your account."
    } else {
      const actor = await requireActor()
      await rateLimit(
        `account-user:${action.data}`,
        actor.id,
        action.data === "verify-phone" ? 5 : 3,
      )
      if (action.data === "verify-phone") {
        const { code } = parse(
          z.object({ code: z.string().regex(/^\d{6}$/), ...honeypot }).strict(),
        )
        await db.$transaction(async (tx) => {
          await consume(
            tx,
            secretDigest(`${actor.id}:${code}`),
            "PHONE_VERIFY",
            actor.id,
          )
          await tx.user.update({
            where: { id: actor.id },
            data: { phoneVerified: new Date() },
          })
        })
        message =
          "Phone verified. Refresh your workspace to see the updated status."
      } else {
        parse(z.object(honeypot).strict())
        if (
          action.data === "send-otp" &&
          (process.env.NODE_ENV === "production" ||
            process.env.SMS_PROVIDER !== "stub")
        )
          throw new HttpError(
            503,
            "SMS verification is unavailable until the SMS provider is configured.",
          )
        const user = await db.user.findUniqueOrThrow({
          where: { id: actor.id },
        })
        const delivery = await db.$transaction((tx) =>
          issue(
            tx,
            user,
            action.data === "send-otp" ? "PHONE_VERIFY" : "EMAIL_VERIFY",
          ),
        )
        deliveryId = delivery.id
        message =
          action.data === "send-otp"
            ? "Development SMS code generated. Check the local Next.js terminal (SMS stub)."
            : "Email verification link requested. Check your inbox."
      }
    }
    if (deliveryId) await deliver(deliveryId)
    return NextResponse.json({ message }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return apiError(error)
  }
}
