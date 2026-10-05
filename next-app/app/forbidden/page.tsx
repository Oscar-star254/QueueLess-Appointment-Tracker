import Link from "next/link"
import { Brand, Card } from "../../../src/fundi/ui"
import { Heading } from "../../../src/fundi/presentation"
import { ShieldCheck } from "lucide-react"
export default function Forbidden() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <Brand />
        <ShieldCheck className="mt-8 text-brand-600" size={32} />
        <Heading level={1} className="mt-4 font-display text-2xl font-bold">
          This space needs a different role.
        </Heading>
        <p className="mt-3 text-sm text-muted">
          Your account does not have permission to access this section.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-sm font-medium text-brand-700"
        >
          Back to your workspace →
        </Link>
      </Card>
    </main>
  )
}
