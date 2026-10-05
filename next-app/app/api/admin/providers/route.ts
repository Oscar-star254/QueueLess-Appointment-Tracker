import { NextResponse } from "next/server"
import { requireActor } from "@/lib/authorization"
import { apiError } from "@/lib/security"
import { db } from "@/lib/db"
import { z } from "zod"
export async function GET(request: Request) {
  try {
    await requireActor("providers")
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = z
      .object({ page: z.coerce.number().int().min(1).max(10000).default(1) })
      .strict()
      .safeParse(params)
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid pagination." }, {
        status: 400,
      })
    const users = await db.user.findMany({
      where: { role: "PROVIDER" },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      skip: (parsed.data.page - 1) * 20,
    })
    return NextResponse.json({ users }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return apiError(error)
  }
}
