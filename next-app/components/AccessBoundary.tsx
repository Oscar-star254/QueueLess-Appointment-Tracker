import Link from "next/link"
import { requirePage } from "@/lib/pages"
import { Heading } from "../../src/fundi/presentation"
import { Brand, Card } from "../../src/fundi/ui"
import type { permissions } from "@/lib/validation"
export default async function AccessBoundary({
  permission,
  title,
}: {
  permission: keyof typeof permissions
  title: string
}) {
  const actor = await requirePage(permission)
  return (
    <main className="mx-auto max-w-3xl p-6 md:p-12">
      <Brand />
      <Card className="mt-8 p-6">
        <Heading level={1} className="font-display text-2xl font-bold">
          {title}
        </Heading>
        <p className="mt-3 text-sm text-muted">
          Access verified server-side for {actor.name} ({actor.role}). This
          route establishes the Stage 1 permission boundary; management tools
          arrive in Stage 5.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-sm font-medium text-brand-700"
        >
          Return to your workspace →
        </Link>
      </Card>
    </main>
  )
}
