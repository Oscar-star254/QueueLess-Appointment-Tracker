export type ListingStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "REJECTED"

export type ProviderListingSummary = {
  id: string
  name: string
  slug: string
  status: ListingStatus
  verified: boolean
  updatedAt: string
  rejectionReason: string | null
  category: { name: string }
  county: { name: string }
  area: { name: string } | null
  _count: { images: number }
}

export type ListingReferences = {
  categories: {
    id: string
    name: string
    subcategories: { id: string; name: string }[]
  }[]
  counties: {
    id: string
    name: string
    towns: {
      id: string
      name: string
      areas: { id: string; name: string }[]
    }[]
  }[]
}

export type EditableListing = {
  id: string
  name: string
  status: ListingStatus
  rejectionReason: string | null
  categoryId: string
  subcategoryId: string | null
  countyId: string
  townId: string | null
  areaId: string | null
  description: string
  services: string[]
  address: string | null
  latitude: number | null
  longitude: number | null
  phone: string
  whatsapp: string | null
  email: string | null
  website: string | null
  minPrice: number | null
  maxPrice: number | null
  yearsExperience: number | null
  workingHours: Record<string, string> | null
  images: {
    id: string
    url: string
    alt: string
    width: number
    height: number
  }[]
}
