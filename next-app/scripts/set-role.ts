import { PrismaClient, Prisma } from "@prisma/client"
import { compare } from "bcryptjs"
import { z } from "zod"
import { emailSchema, roles } from "../lib/validation"
const db = new PrismaClient()
async function main() {
  const data = z
    .object({
      targetEmail: emailSchema,
      role: z.enum(roles),
      actorEmail: emailSchema,
      password: z.string().min(1).max(72),
    })
    .parse({
      targetEmail: process.argv[2],
      role: process.argv[3],
      actorEmail: process.env.ROLE_ADMIN_EMAIL,
      password: process.env.ROLE_ADMIN_PASSWORD,
    })
  const actor = await db.user.findUnique({ where: { email: data.actorEmail } })
  if (
    !actor ||
    actor.role !== "SUPER_ADMIN" ||
    actor.suspendedAt ||
    actor.totpEnabled ||
    !(await compare(data.password, actor.passwordHash))
  )
    throw new Error("Not authorized.")
  await db.$transaction(
    async (tx) => {
      const currentActor = await tx.user.findUniqueOrThrow({
        where: { id: actor.id },
      })
      if (
        currentActor.role !== "SUPER_ADMIN" ||
        currentActor.suspendedAt ||
        currentActor.sessionVersion !== actor.sessionVersion
      )
        throw new Error("Actor no longer authorized.")
      const target = await tx.user.findUniqueOrThrow({
        where: { email: data.targetEmail },
      })
      if (
        target.role === "SUPER_ADMIN" &&
        data.role !== "SUPER_ADMIN" &&
        (await tx.user.count({
          where: { role: "SUPER_ADMIN", suspendedAt: null },
        })) <= 1
      )
        throw new Error("Cannot demote the last active Super Admin.")
      await tx.user.update({
        where: { id: target.id },
        data: { role: data.role, sessionVersion: { increment: 1 } },
      })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "USER_ROLE_CHANGE",
          targetType: "User",
          targetId: target.id,
          metadata: {
            from: target.role,
            to: data.role,
            source: "authenticated-cli",
          },
        },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
  console.info(
    "Role updated. Existing sessions revoked and audit event recorded.",
  )
}
main()
  .catch(() => {
    console.error(
      "Role update failed. Check actor credentials, target account, role, and database connection.",
    )
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
