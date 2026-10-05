"use client"
import { Heading } from "../../src/fundi/presentation"
import { Button, Card } from "../../src/fundi/ui"
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md p-8">
        <Heading level={1} className="font-display text-xl font-bold">
          We couldn’t load this page.
        </Heading>
        <p className="mt-3 text-sm text-muted">
          Please try again. If this persists, check the database connection and
          environment configuration.
        </p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </Card>
    </main>
  )
}
