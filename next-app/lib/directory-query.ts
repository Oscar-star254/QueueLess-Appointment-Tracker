import { z } from "zod"
import type { Prisma } from "@prisma/client"
import type { DirectoryFilters } from "../../src/fundi/public-types"
const slug = z
  .string()
  .regex(/^[a-z0-9-]*$/)
  .max(80)
export const searchSchema = z
  .object({
    q: z.string().trim().max(80).default(""),
    category: z.enum(["", "plumbers", "electricians"]).default(""),
    area: slug.default(""),
    verified: z.enum(["true", "false"]).default("false"),
    sort: z.enum(["recommended", "newest", "rating"]).default("recommended"),
    page: z.coerce.number().int().min(1).max(1000).default(1),
  })
  .strict()
export function parseSearch(input: Record<string, unknown>): DirectoryFilters {
  const value = searchSchema.parse(input)
  return { ...value, verified: value.verified === "true" }
}
export function publishedWhere(now = new Date()): Prisma.ListingWhereInput {
  return {
    status: "ACTIVE",
    expiresAt: { gt: now },
    category: { active: true },
    owner: {
      suspendedAt: null,
      emailVerified: { not: null },
      phoneVerified: { not: null },
    },
  }
}
export function escapeSearchTerm(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&")
}
export function searchWhere(
  filters: DirectoryFilters,
  now = new Date(),
): Prisma.ListingWhereInput {
  const query = escapeSearchTerm(filters.q)
  return {
    ...publishedWhere(now),
    county: { slug: "nairobi" },
    ...(filters.category
      ? { category: { slug: filters.category, active: true } }
      : {}),
    ...(filters.area ? { area: { slug: filters.area } } : {}),
    ...(filters.verified ? { verified: true } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { services: { has: filters.q.toLowerCase() } },
          ],
        }
      : {}),
  }
}
// Explicit projection: do not serialize contact details, identity documents, or owner accounts.
export const publicSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  services: true,
  category: { select: { name: true, slug: true } },
  county: { select: { name: true } },
  town: { select: { name: true } },
  area: { select: { name: true } },
  verified: true,
  featuredUntil: true,
  yearsExperience: true,
  minPrice: true,
  maxPrice: true,
  images: {
    select: { url: true, alt: true, width: true, height: true },
    orderBy: { position: "asc" },
    take: 6,
  },
} satisfies Prisma.ListingSelect
