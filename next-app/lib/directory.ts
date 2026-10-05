import { Prisma } from "@prisma/client"
import { db } from "./db"
import {
  escapeSearchTerm,
  publicSelect,
  publishedWhere,
  searchWhere,
} from "./directory-query"
import type {
  DirectoryFilters,
  DirectoryListing,
  DirectoryResult,
  PublicDetail,
} from "../../src/fundi/public-types"

function present(
  row: Prisma.ListingGetPayload<{ select: typeof publicSelect }>,
  rating: number | null,
  reviewCount: number,
): DirectoryListing {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    services: row.services,
    category: row.category.name,
    categorySlug: row.category.slug,
    county: row.county.name,
    town: row.town?.name ?? null,
    area: row.area?.name ?? null,
    verified: row.verified,
    featured: !!row.featuredUntil && row.featuredUntil > new Date(),
    yearsExperience: row.yearsExperience,
    minPrice: row.minPrice === null ? null : Number(row.minPrice),
    maxPrice: row.maxPrice === null ? null : Number(row.maxPrice),
    images: row.images,
    rating,
    reviewCount,
  }
}
export async function searchDirectory(
  filters: DirectoryFilters,
): Promise<DirectoryResult> {
  const now = new Date()
  const where = searchWhere(filters, now)
  // Parameterized SQL ranks only unexpired featured placements and approved reviews.
  const q = `%${escapeSearchTerm(filters.q)}%`
  const ids = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT l."id" FROM "Listing" l JOIN "User" u ON u."id"=l."ownerId"
    JOIN "Category" c ON c."id"=l."categoryId" JOIN "County" co ON co."id"=l."countyId"
    LEFT JOIN "Area" a ON a."id"=l."areaId"
    LEFT JOIN LATERAL (SELECT AVG("rating") AS rating FROM "Review" WHERE "listingId"=l."id" AND "status"='APPROVED') r ON TRUE
    WHERE l."status"='ACTIVE' AND l."expiresAt">${now} AND c."active"=TRUE
    AND u."suspendedAt" IS NULL AND u."emailVerified" IS NOT NULL AND u."phoneVerified" IS NOT NULL
    AND co."slug"='nairobi'
    ${
      filters.category
        ? Prisma.sql`AND c."slug"=${filters.category}`
        : Prisma.empty
    }
    ${filters.area ? Prisma.sql`AND a."slug"=${filters.area}` : Prisma.empty}
    ${filters.verified ? Prisma.sql`AND l."verified"=TRUE` : Prisma.empty}
    ${
      filters.q
        ? Prisma.sql`AND (l."name" ILIKE ${q} OR l."description" ILIKE ${q} OR ${filters.q.toLowerCase()}=ANY(l."services"))`
        : Prisma.empty
    }
    ORDER BY CASE WHEN ${filters.sort}='recommended' AND l."featuredUntil">${now} THEN 1 ELSE 0 END DESC,
    CASE WHEN ${filters.sort}='rating' THEN COALESCE(r.rating,0) END DESC,
    l."createdAt" DESC, l."id" ASC LIMIT 12 OFFSET ${(filters.page - 1) * 12}
  `)
  const [total, rows, ratings, areas] = await Promise.all([
    db.listing.count({ where }),
    db.listing.findMany({
      where: { ...where, id: { in: ids.map((row) => row.id) } },
      select: publicSelect,
    }),
    db.review.groupBy({
      by: ["listingId"],
      where: {
        listingId: { in: ids.map((row) => row.id) },
        status: "APPROVED",
      },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.area.findMany({
      where: { town: { county: { slug: "nairobi" } } },
      select: { slug: true },
      orderBy: { name: "asc" },
    }),
  ])
  const listings = ids.flatMap(({ id }) => {
    const row = rows.find((item) => item.id === id)
    const rating = ratings.find((item) => item.listingId === id)
    return row
      ? [present(row, rating?._avg.rating ?? null, rating?._count.rating ?? 0)]
      : []
  })
  return {
    listings,
    total,
    pages: Math.ceil(total / 12),
    filters,
    areas: areas.map((area) => area.slug),
  }
}
export async function listingDetail(
  slug: string,
): Promise<PublicDetail | null> {
  const row = await db.listing.findFirst({
    where: { ...publishedWhere(), slug },
    select: {
      ...publicSelect,
      address: true,
      workingHours: true,
      reviews: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          rating: true,
          comment: true,
          providerReply: true,
          createdAt: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })
  if (!row) return null
  const ratings = await db.review.aggregate({
    where: { listingId: row.id, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const hours =
    row.workingHours &&
    typeof row.workingHours === "object" &&
    !Array.isArray(row.workingHours)
      ? row.workingHours as Record<string, string>
      : null
  return {
    ...present(row, ratings._avg.rating, ratings._count.rating),
    address: row.address,
    workingHours: hours,
    reviews: row.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      name: review.user.name.split(" ")[0],
      reply: review.providerReply,
      createdAt: review.createdAt.toISOString(),
    })),
  }
}
