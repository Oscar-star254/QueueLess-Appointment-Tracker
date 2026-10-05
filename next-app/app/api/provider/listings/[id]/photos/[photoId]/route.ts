import { NextResponse } from "next/server"
import { requireActor } from "@/lib/authorization"
import { deleteListingPhoto } from "@/lib/cloudinary"
import { db } from "@/lib/db"
import { editableStatuses } from "@/lib/provider-listings"
import {
  apiError,
  assertSameOrigin,
  HttpError,
} from "@/lib/security"

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  try {
    assertSameOrigin(request)
    const actor = await requireActor()
    const { id, photoId } = await context.params
    const image = await db.listingImage.findFirst({
      where: { id: photoId, listingId: id, listing: { ownerId: actor.id } },
      include: { listing: { select: { status: true } } },
    })
    if (!image) throw new HttpError(404, "Photo not found.")
    if (
      !editableStatuses.includes(
        image.listing.status as (typeof editableStatuses)[number],
      )
    )
      throw new HttpError(409, "This listing can no longer be edited.")
    await deleteListingPhoto(image.storageKey)
    await db.listingImage.delete({ where: { id: photoId } })
    return NextResponse.json({ message: "Photo removed." })
  } catch (error) {
    return apiError(error)
  }
}
