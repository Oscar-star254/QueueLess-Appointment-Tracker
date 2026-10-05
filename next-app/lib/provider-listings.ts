import { createHash } from "node:crypto"
import { db } from "./db"
import { HttpError } from "./security"
import { listingSchema } from "./validation"

export const defaultHours = {
  monday: "08:00–18:00",
  tuesday: "08:00–18:00",
  wednesday: "08:00–18:00",
  thursday: "08:00–18:00",
  friday: "08:00–18:00",
  saturday: "09:00–14:00",
  sunday: "Closed",
}

export async function listingReferences() {
  const [categories, counties] = await Promise.all([
    db.category.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        subcategories: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
    db.county.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        name: true,
        towns: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            areas: {
              orderBy: { name: "asc" },
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
  ])
  return { categories, counties }
}

export async function parseListing(input: unknown) {
  const result = listingSchema.safeParse(input)
  if (!result.success)
    throw new HttpError(
      400,
      result.error.issues[0]?.message || "Check your listing details.",
    )
  const value = result.data
  const [category, county, subcategory, town, area] = await Promise.all([
    db.category.findFirst({
      where: { id: value.categoryId, active: true },
      select: { id: true },
    }),
    db.county.findUnique({
      where: { id: value.countyId },
      select: { id: true },
    }),
    value.subcategoryId
      ? db.subcategory.findFirst({
          where: {
            id: value.subcategoryId,
            categoryId: value.categoryId,
          },
          select: { id: true },
        })
      : null,
    value.townId
      ? db.town.findFirst({
          where: { id: value.townId, countyId: value.countyId },
          select: { id: true },
        })
      : null,
    value.areaId && value.townId
      ? db.area.findFirst({
          where: { id: value.areaId, townId: value.townId },
          select: { id: true },
        })
      : null,
  ])
  if (
    !category ||
    !county ||
    (value.subcategoryId && !subcategory) ||
    (value.townId && !town) ||
    (value.areaId && !area)
  )
    throw new HttpError(400, "Choose a valid category and location.")
  return value
}

export async function uniqueListingSlug(name: string, ownerId: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "fundi"
  const suffix = createHash("sha256")
    .update(ownerId)
    .digest("hex")
    .slice(0, 6)
  let candidate = `${base}-${suffix}`
  let sequence = 2
  while (await db.listing.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}-${sequence}`
    sequence++
  }
  return candidate
}

export const editableStatuses = ["DRAFT", "REJECTED"] as const
