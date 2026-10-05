import ListingEditor from "@/components/ListingEditor"
import { db } from "@/lib/db"
import { listingReferences } from "@/lib/provider-listings"
import { requirePage } from "@/lib/pages"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requirePage()
  if (user.role !== "PROVIDER") redirect("/forbidden")
  const listing = await db.listing.findFirst({
    where: { id: (await params).id, ownerId: user.id },
    select: {
      id: true,
      name: true,
      status: true,
      rejectionReason: true,
      categoryId: true,
      subcategoryId: true,
      countyId: true,
      townId: true,
      areaId: true,
      description: true,
      services: true,
      address: true,
      latitude: true,
      longitude: true,
      phone: true,
      whatsapp: true,
      email: true,
      website: true,
      minPrice: true,
      maxPrice: true,
      yearsExperience: true,
      workingHours: true,
      images: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
        },
      },
    },
  })
  if (!listing) notFound()
  return (
    <ListingEditor
      references={await listingReferences()}
      defaultPhone={user.phone}
      listing={{
        ...listing,
        minPrice: listing.minPrice ? Number(listing.minPrice) : null,
        maxPrice: listing.maxPrice ? Number(listing.maxPrice) : null,
        workingHours:
          listing.workingHours &&
          typeof listing.workingHours === "object" &&
          !Array.isArray(listing.workingHours)
            ? (listing.workingHours as Record<string, string>)
            : null,
      }}
    />
  )
}
