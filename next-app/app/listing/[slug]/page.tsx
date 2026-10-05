import { notFound } from "next/navigation"
import { ListingScreen } from "@/components/DirectoryScreen"
import { listingDetail } from "@/lib/directory"
export const dynamic = "force-dynamic"
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return { title: "Listing not found" }
  const listing = await listingDetail(slug)
  return listing
    ? {
        title: `${listing.name} — ${listing.category} in Nairobi`,
        description: listing.description.slice(0, 155),
      }
    : { title: "Listing not found" }
}
export default async function Listing({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound()
  const listing = await listingDetail(slug)
  if (!listing) notFound()
  return <ListingScreen listing={listing} />
}
