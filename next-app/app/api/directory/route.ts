import { NextResponse } from "next/server"
import { z } from "zod"
import { parseSearch } from "@/lib/directory-query"
import { searchDirectory } from "@/lib/directory"
import { apiError } from "@/lib/security"
export async function GET(request: Request) {
  try {
    const filters = parseSearch(
      Object.fromEntries(new URL(request.url).searchParams),
    )
    return NextResponse.json(await searchDirectory(filters), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Invalid search filters." }, {
        status: 400,
      })
    return apiError(error)
  }
}
