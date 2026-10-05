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
const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .refine((value) => !/[<>]/.test(value)),
    email: z.string().trim().email().max(254),
    message: z.string().trim().min(10).max(2000),
    consent: z.literal(true),
    website: z.literal(""),
  })
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
    const input = schema.safeParse(await readBody(request))
    if (!input.success)
      throw new HttpError(
        400,
        "Please check your name, email, message, and consent.",
      )
    await rateLimit(
      "public-inquiry",
      requestIdentity(request.headers),
      process.env.TRUST_PROXY === "true" ? 5 : 100,
    )
    await rateLimit("inquiry-email", input.data.email.toLowerCase(), 5)
    await db.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { ...publishedWhere(), slug },
        select: { id: true, ownerId: true },
      })
      if (!listing) throw new HttpError(404, "Listing not found.")
      await tx.inquiry.create({
        data: {
          listingId: listing.id,
          name: input.data.name,
          email: input.data.email.toLowerCase(),
          message: input.data.message,
          consentAt: new Date(),
        },
      })
      await tx.leadEvent.create({
        data: {
          listingId: listing.id,
          type: "INQUIRY",
          visitorHash: requestIdentity(request.headers),
        },
      })
      await tx.notification.create({
        data: {
          userId: listing.ownerId,
          title: "New customer inquiry",
          message: "A customer has contacted you about your listing.",
          link: "/dashboard",
        },
      })
    })
    return NextResponse.json(
      {
        message:
          "Your inquiry has been saved for the provider. Email delivery is not guaranteed.",
      },
      { status: 201 },
    )
  } catch (error) {
    return apiError(error)
  }
}
