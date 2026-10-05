import { requirePage } from "@/lib/pages"
import { redirect } from "next/navigation"
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requirePage()
  if (user.role === "PROVIDER") redirect("/forbidden")
  return children
}
