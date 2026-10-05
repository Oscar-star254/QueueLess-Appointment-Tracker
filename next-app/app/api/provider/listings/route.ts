import { NextResponse } from "next/server"
import { requireActor } from "@/lib/authorization"
import { db } from "@/lib/db"
import {
  parseListing,
  uniqueListingSlug,
} from "@/lib/provider-listings"
import {
  apiError,
  assertSameOrigin,
  readBody,
} from "@/lib/security"

export async function GET() {
  try {
    const actor = await requireActor()
    const listings = await db.listing.findMany({
      where: actor.role === "PROVIDER" ? { ownerId: actor.id } : {},
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        verified: true,
        updatedAt: true,
        rejectionReason: true,
        category: { select: { name: true } },
        county: { select: { name: true } },
        area: { select: { name: true } },
        _count: { select: { images: true } },
      },
    })
    return NextResponse.json(
      { listings },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const actor = await requireActor()
    if (actor.role !== "PROVIDER")
      return NextResponse.json(
        { error: "Only provider accounts can create listings." },
        { status: 403 },
      )
    const data = await parseListing(await readBody(request))
    const listing = await db.$transaction(async (tx) => {
      const created = await tx.listing.create({
        data: {
          ...data,
          slug: await uniqueListingSlug(data.name, actor.id),
          ownerId: actor.id,
          status: "DRAFT",
        },
        select: { id: true, slug: true },
      })
      await tx.providerProfile.upsert({
        where: { userId: actor.id },
        update: { businessName: data.name },
        create: {
          userId: actor.id,
          businessName: data.name,
          consentAt: new Date(),
        },
      })
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "LISTING_CREATED",
          targetType: "Listing",
          targetId: created.id,
        },
      })
      return created
    })
    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
