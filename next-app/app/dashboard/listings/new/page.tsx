import ListingEditor from "@/components/ListingEditor"
import { listingReferences } from "@/lib/provider-listings"
import { requirePage } from "@/lib/pages"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const user = await requirePage()
  if (user.role !== "PROVIDER") redirect("/forbidden")
  return (
    <ListingEditor
      references={await listingReferences()}
      defaultPhone={user.phone}
    />
  )
}
