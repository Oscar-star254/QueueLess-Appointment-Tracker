import Workspace from "../../../src/fundi/Workspace"
import ProviderDashboard from "@/components/ProviderDashboard"
import { requirePage } from "@/lib/pages"
import { workspaceData } from "@/lib/authorization"
import { db } from "@/lib/db"
export const dynamic = "force-dynamic"
export default async function Dashboard() {
  const user = await requirePage()
  if (user.role === "PROVIDER") {
    const listings = await db.listing.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        verified: true,
        updatedAt: true,
        rejectionReason: true,
        category: { select: { name: true } },
        county: { select: { name: true } },
        area: { select: { name: true } },
        _count: { select: { images: true } },
      },
    })
    return (
      <ProviderDashboard
        actor={{
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: !!user.emailVerified,
          phoneVerified: !!user.phoneVerified,
        }}
        listings={listings.map((listing) => ({
          ...listing,
          updatedAt: listing.updatedAt.toISOString(),
        }))}
      />
    )
  }
  return (
    <Workspace
      actor={{
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.phoneVerified,
      }}
      stats={await workspaceData(user)}
    />
  )
}
