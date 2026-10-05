"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PublicDirectory, { PublicProfile } from "../../src/fundi/PublicDirectory"
import type {
  DirectoryResult,
  PublicDetail,
  DirectoryFilters,
} from "../../src/fundi/public-types"
export function DirectoryScreen({
  data,
  home = false,
}: {
  data: DirectoryResult
  home?: boolean
}) {
  const router = useRouter()
  function search(filters: DirectoryFilters) {
    const query = new URLSearchParams({
      q: filters.q,
      category: filters.category,
      area: filters.area,
      verified: String(filters.verified),
      sort: filters.sort,
      page: String(filters.page),
    })
    router.push(`/directory?${query}`)
    router.refresh()
  }
  return (
    <PublicDirectory data={data} home={home} Link={Link} onSearch={search} />
  )
}
export function ListingScreen({ listing }: { listing: PublicDetail }) {
  return <PublicProfile listing={listing} Link={Link} />
}
