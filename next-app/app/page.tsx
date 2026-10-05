import { searchDirectory } from "@/lib/directory"
import { parseSearch } from "@/lib/directory-query"
import { DirectoryScreen } from "@/components/DirectoryScreen"
export const dynamic = "force-dynamic"
export default async function Home() {
  const filters = parseSearch({})
  const data = await searchDirectory(filters).catch(() => ({
    listings: [],
    total: 0,
    pages: 0,
    filters,
    areas: [],
    unavailable: true,
  }))
  return <DirectoryScreen data={data} home />
}
