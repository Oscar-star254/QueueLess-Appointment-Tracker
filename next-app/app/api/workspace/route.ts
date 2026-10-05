import { NextResponse } from "next/server"
import { requireActor, workspaceData } from "@/lib/authorization"
import { apiError } from "@/lib/security"
export async function GET() {
  try {
    const user = await requireActor()
    return NextResponse.json(
      {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: !!user.emailVerified,
          phoneVerified: !!user.phoneVerified,
        },
        stats: await workspaceData(user),
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    return apiError(error)
  }
}
