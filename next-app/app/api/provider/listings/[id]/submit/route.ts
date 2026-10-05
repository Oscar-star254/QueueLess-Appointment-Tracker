import { NextResponse } from "next/server"
import { requireActor } from "@/lib/authorization"
import { db } from "@/lib/db"
import { editableStatuses } from "@/lib/provider-listings"
import {
  apiError,
  assertSameOrigin,
  HttpError,
} from "@/lib/security"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request)
    const actor = await requireActor()
    if (!actor.emailVerified || !actor.phoneVerified)
      throw new HttpError(
        403,
        "Verify your email and phone number before submitting a listing.",
      )
    const { id } = await context.params
    const listing = await db.listing.findFirst({
      where: { id, ownerId: actor.id },
      include: { _count: { select: { images: true } } },
    })
    if (!listing) throw new HttpError(404, "Listing not found.")
    if (
      !editableStatuses.includes(
        listing.status as (typeof editableStatuses)[number],
      )
    )
      throw new HttpError(409, "This listing has already been submitted.")
    if (
      !listing.name ||
      listing.description.length < 50 ||
      !listing.services.length ||
      !listing.phone
    )
      throw new HttpError(
        400,
        "Complete the business details before submitting.",
      )
    await db.$transaction([
      db.listing.update({
        where: { id },
        data: {
          status: "PENDING_REVIEW",
          rejectionReason: null,
        },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.id,
          action: "LISTING_SUBMITTED",
          targetType: "Listing",
          targetId: id,
          metadata: { photoCount: listing._count.images },
        },
      }),
    ])
    return NextResponse.json({
      message: "Your listing has been submitted for review.",
    })
  } catch (error) {
    return apiError(error)
  }
}
