export interface DirectoryImage {
  url: string
  alt: string
  width: number
  height: number
}
export type DirectoryListing = {
  id: string
  slug: string
  name: string
  category: string
  categorySlug: string
  county: string
  town: string | null
  area: string | null
  description: string
  services: string[]
  verified: boolean
  featured: boolean
  yearsExperience: number | null
  minPrice: number | null
  maxPrice: number | null
  rating: number | null
  reviewCount: number
  images: DirectoryImage[]
}
export type DirectoryFilters = {
  q: string
  category: string
  area: string
  verified: boolean
  sort: "recommended" | "newest" | "rating"
  page: number
}
export type DirectoryResult = {
  listings: DirectoryListing[]
  total: number
  pages: number
  filters: DirectoryFilters
  areas: string[]
  unavailable?: boolean
}
export type PublicDetail = DirectoryListing & {
  address: string | null
  workingHours: Record<string, string> | null
  reviews: {
    id: string
    rating: number
    comment: string
    name: string
    reply: string | null
    createdAt: string
  }[]
}
