import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { db } from "./db"
import { HttpError } from "./security"
import { canAccess, type permissions } from "./validation"
export async function requireActor(
  permission: keyof typeof permissions = "workspace",
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new HttpError(401, "Please sign in.")
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      suspendedAt: true,
      sessionVersion: true,
    },
  })
  if (
    !user ||
    user.suspendedAt ||
    user.sessionVersion !== session.user.sessionVersion
  )
    throw new HttpError(401, "Your session has expired. Please sign in again.")
  if (!canAccess(user.role, permission))
    throw new HttpError(403, "You do not have permission to view this page.")
  return user
}
export async function workspaceData(
  user: Awaited<ReturnType<typeof requireActor>>,
) {
  const where = user.role === "PROVIDER" ? { ownerId: user.id } : {}
  const [listings, active, pending, providers] = await Promise.all([
    db.listing.count({ where }),
    db.listing.count({ where: { ...where, status: "ACTIVE" } }),
    db.listing.count({ where: { ...where, status: "PENDING_REVIEW" } }),
    user.role === "PROVIDER"
      ? Promise.resolve(1)
      : db.user.count({ where: { role: "PROVIDER", suspendedAt: null } }),
  ])
  return { listings, active, pending, providers }
}
