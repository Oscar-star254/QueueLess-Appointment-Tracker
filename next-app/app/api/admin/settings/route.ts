import { NextResponse } from "next/server"
import { requireActor } from "@/lib/authorization"
import { apiError } from "@/lib/security"
import { db } from "@/lib/db"
export async function GET() {
  try {
    await requireActor("settings")
    return NextResponse.json({ settings: await db.setting.findMany() }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return apiError(error)
  }
}
