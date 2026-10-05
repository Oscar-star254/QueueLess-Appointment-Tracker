import { redirect } from "next/navigation"
import { requireActor } from "./authorization"
import { HttpError } from "./security"
import type { permissions } from "./validation"
export async function requirePage(
  permission: keyof typeof permissions = "workspace",
) {
  try {
    return await requireActor(permission)
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect("/login")
    if (error instanceof HttpError && error.status === 403)
      redirect("/forbidden")
    throw error
  }
}
