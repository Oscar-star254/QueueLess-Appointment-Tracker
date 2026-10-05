import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { publishedWhere } from "@/lib/directory-query"
import {
  apiError,
  assertSameOrigin,
  HttpError,
  rateLimit,
  readBody,
  requestIdentity,
} from "@/lib/security"
const bodySchema = z
  .object({ type: z.enum(["VIEW", "PHONE_REVEAL", "WHATSAPP_CLICK"]) })
  .strict()
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request)
    const { slug } = await context.params
    if (!/^[a-z0-9-]{1,120}$/.test(slug))
      throw new HttpError(404, "Listing not found.")
    const parsed = bodySchema.safeParse(await readBody(request))
    if (!parsed.success) throw new HttpError(400, "Invalid contact request.")
    const identity = requestIdentity(request.headers)
    await rateLimit(
      "public-contact",
      identity,
      process.env.TRUST_PROXY === "true" ? 60 : 1500,
    )
    const result = await db.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { ...publishedWhere(), slug },
        select: { id: true, phone: true, whatsapp: true },
      })
      if (!listing) throw new HttpError(404, "Listing not found.")
      if (parsed.data.type === "WHATSAPP_CLICK" && !listing.whatsapp)
        throw new HttpError(404, "WhatsApp is not available for this fundi.")
      await tx.leadEvent.create({
        data: {
          listingId: listing.id,
          type: parsed.data.type,
          visitorHash: identity,
        },
      })
      return parsed.data.type === "VIEW"
        ? { recorded: true }
        : {
            number:
              parsed.data.type === "PHONE_REVEAL"
                ? listing.phone
                : listing.whatsapp,
          }
    })
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return apiError(error)
  }
}
