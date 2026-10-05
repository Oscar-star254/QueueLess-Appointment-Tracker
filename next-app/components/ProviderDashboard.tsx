"use client"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react"
import { Badge, Brand, Button, Card } from "../../src/fundi/ui"
import { Heading } from "../../src/fundi/presentation"
import type { Actor } from "../../src/fundi/Workspace"
import type {
  ListingStatus,
  ProviderListingSummary,
} from "../../src/fundi/provider-types"

const statusLabel: Record<ListingStatus, string> = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Pending payment",
  PENDING_REVIEW: "In review",
  ACTIVE: "Live",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
  REJECTED: "Needs changes",
}

function tone(status: ListingStatus): "green" | "amber" | "gray" {
  if (status === "ACTIVE") return "green"
  if (status === "PENDING_REVIEW" || status === "REJECTED") return "amber"
  return "gray"
}

export default function ProviderDashboard({
  actor,
  listings,
}: {
  actor: Actor
  listings: ProviderListingSummary[]
}) {
  const router = useRouter()
  const live = listings.filter((listing) => listing.status === "ACTIVE").length
  const pending = listings.filter(
    (listing) => listing.status === "PENDING_REVIEW",
  ).length
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Brand />
          <div className="text-right">
            <p className="text-sm font-semibold">{actor.name}</p>
            <p className="text-xs text-muted">Provider workspace</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Badge>Provider dashboard</Badge>
            <Heading
              level={1}
              className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl"
            >
              Grow your business locally.
            </Heading>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Keep your services accurate, add recent work, and help Nairobi
              customers know when and where you are available.
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/listings/new")}>
            <Plus size={16} /> Create listing
          </Button>
        </div>

        {(!actor.emailVerified || !actor.phoneVerified) && (
          <Card className="mt-6 flex flex-col gap-4 border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
            <ShieldCheck className="shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Finish verifying your account
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Verification strengthens customer trust. You can prepare a
                draft now while completing email and phone verification.
              </p>
            </div>
          </Card>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            { label: "All listings", value: listings.length, icon: Store },
            { label: "Live", value: live, icon: CheckCircle2 },
            { label: "Awaiting review", value: pending, icon: Clock3 },
          ].map((item) => (
            <Card key={item.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">{item.label}</p>
                <item.icon size={17} className="text-brand-600" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <Heading level={2} className="font-display text-xl font-bold">
              Your listings
            </Heading>
            <p className="mt-1 text-xs text-muted">
              Draft, submit, and monitor every business profile.
            </p>
          </div>
        </div>

        {listings.length ? (
          <div className="mt-4 grid gap-4">
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className="group p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Store size={21} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Heading level={3} className="font-semibold">
                        {listing.name}
                      </Heading>
                      <Badge tone={tone(listing.status)}>
                        {statusLabel[listing.status]}
                      </Badge>
                      {listing.verified && <Badge>Verified</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span>{listing.category.name}</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {listing.area?.name || listing.county.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Camera size={12} />
                        {listing._count.images} photos
                      </span>
                      <span>
                        Updated{" "}
                        {new Intl.DateTimeFormat("en-KE", {
                          dateStyle: "medium",
                        }).format(new Date(listing.updatedAt))}
                      </span>
                    </div>
                    {listing.rejectionReason && (
                      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Reviewer note: {listing.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {listing.status === "ACTIVE" && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          router.push(`/listing/${listing.slug}`)
                        }
                      >
                        <Eye size={15} /> View
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() =>
                        router.push(`/dashboard/listings/${listing.id}`)
                      }
                    >
                      {listing.status === "DRAFT" ||
                      listing.status === "REJECTED"
                        ? "Edit"
                        : "Details"}
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-4 p-8 text-center md:p-12">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Store size={22} />
            </span>
            <Heading level={3} className="mt-4 font-display text-lg font-bold">
              Put your work on the map
            </Heading>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Create a free draft with your services, operating hours, service
              area, and photos. Submit it when everything looks right.
            </p>
            <Button
              className="mt-5"
              onClick={() => router.push("/dashboard/listings/new")}
            >
              <Plus size={16} /> Start your listing
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
