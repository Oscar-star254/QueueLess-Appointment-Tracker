import { notFound } from "next/navigation"
import { DirectoryScreen } from "@/components/DirectoryScreen"
import { searchDirectory } from "@/lib/directory"
import { parseSearch, searchSchema } from "@/lib/directory-query"
export const dynamic = "force-dynamic"
export const metadata = { title: "Find plumbers and electricians in Nairobi" }
export default async function Directory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  if (!searchSchema.safeParse(params).success) notFound()
  const filters = parseSearch(params)
  const data = await searchDirectory(filters).catch(() => ({
    listings: [],
    total: 0,
    pages: 0,
    filters,
    areas: [],
    unavailable: true,
  }))
  return <DirectoryScreen data={data} />
}
