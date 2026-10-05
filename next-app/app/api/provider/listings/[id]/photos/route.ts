import { NextResponse } from "next/server"
import { requireActor } from "@/lib/authorization"
import { uploadListingPhoto } from "@/lib/cloudinary"
import { db } from "@/lib/db"
import { editableStatuses } from "@/lib/provider-listings"
import {
  apiError,
  assertTrustedOrigin,
  HttpError,
} from "@/lib/security"

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request)
    const actor = await requireActor()
    const { id } = await context.params
    const listing = await db.listing.findFirst({
      where: { id, ownerId: actor.id },
      include: { _count: { select: { images: true } }, plan: true },
    })
    if (!listing) throw new HttpError(404, "Listing not found.")
    if (
      !editableStatuses.includes(
        listing.status as (typeof editableStatuses)[number],
      )
    )
      throw new HttpError(409, "This listing can no longer be edited.")
    const maximum = listing.plan?.maxPhotos ?? 5
    if (listing._count.images >= maximum)
      throw new HttpError(400, `This listing allows up to ${maximum} photos.`)
    const declaredSize = Number(request.headers.get("content-length") || 0)
    if (declaredSize > 5_500_000)
      throw new HttpError(413, "Photos must be smaller than 5 MB.")
    const body = await request.formData()
    const file = body.get("photo")
    if (!(file instanceof File) || !allowedTypes.has(file.type))
      throw new HttpError(400, "Choose a JPG, PNG, or WebP photo.")
    if (!file.size || file.size > 5_000_000)
      throw new HttpError(413, "Photos must be smaller than 5 MB.")
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8
    const png =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    const webp =
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    if (!jpeg && !png && !webp)
      throw new HttpError(400, "The selected file is not a valid image.")
    const uploaded = await uploadListingPhoto(file, id)
    const image = await db.listingImage.create({
      data: {
        listingId: id,
        ...uploaded,
        alt: `${listing.name} work photo`,
        position: listing._count.images,
      },
    })
    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
