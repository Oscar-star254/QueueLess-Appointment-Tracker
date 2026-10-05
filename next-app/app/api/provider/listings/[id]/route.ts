import { NextResponse } from "next/server"
import { requireActor } from "@/lib/authorization"
import { deleteListingPhoto } from "@/lib/cloudinary"
import { db } from "@/lib/db"
import {
  editableStatuses,
  parseListing,
} from "@/lib/provider-listings"
import {
  apiError,
  assertSameOrigin,
  HttpError,
  readBody,
} from "@/lib/security"

async function ownedListing(id: string, ownerId: string) {
  const listing = await db.listing.findFirst({
    where: { id, ownerId },
    select: { id: true, status: true },
  })
  if (!listing) throw new HttpError(404, "Listing not found.")
  return listing
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request)
    const actor = await requireActor()
    const { id } = await context.params
    const listing = await ownedListing(id, actor.id)
    if (
      !editableStatuses.includes(
        listing.status as (typeof editableStatuses)[number],
      )
    )
      throw new HttpError(
        409,
        "Only draft or rejected listings can be edited.",
      )
    const data = await parseListing(await readBody(request))
    await db.$transaction([
      db.listing.update({
        where: { id },
        data: { ...data, rejectionReason: null },
      }),
      db.providerProfile.update({
        where: { userId: actor.id },
        data: { businessName: data.name },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.id,
          action: "LISTING_UPDATED",
          targetType: "Listing",
          targetId: id,
        },
      }),
    ])
    return NextResponse.json({ message: "Draft saved." })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request)
    const actor = await requireActor()
    const { id } = await context.params
    const listing = await ownedListing(id, actor.id)
    if (
      !editableStatuses.includes(
        listing.status as (typeof editableStatuses)[number],
      )
    )
      throw new HttpError(
        409,
        "Only draft or rejected listings can be deleted.",
      )
    const images = await db.listingImage.findMany({
      where: { listingId: id },
      select: { storageKey: true },
    })
    await Promise.all(
      images.map((image) => deleteListingPhoto(image.storageKey)),
    )
    await db.$transaction([
      db.auditLog.create({
        data: {
          actorId: actor.id,
          action: "LISTING_DELETED",
          targetType: "Listing",
          targetId: id,
        },
      }),
      db.listing.delete({ where: { id } }),
    ])
    return NextResponse.json({ message: "Listing deleted." })
  } catch (error) {
    return apiError(error)
  }
}
