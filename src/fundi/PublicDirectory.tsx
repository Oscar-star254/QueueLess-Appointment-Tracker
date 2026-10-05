"use client" /* Saving is optional on browsers that block storage. */
import { useEffect, useState } from "react"
import type { ComponentType, ReactNode } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Wrench,
  Zap,
} from "lucide-react"
import { Badge, Brand, Button, Card, Input } from "./ui"
import { ChoiceMenu, Heading } from "./presentation"
import type {
  DirectoryFilters,
  DirectoryListing,
  DirectoryResult,
  PublicDetail,
} from "./public-types"

export type SiteLink = ComponentType<{
  href: string
  children: ReactNode
  className?: string
}>
const titleCase = (value: string) =>
  value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
const money = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value)
export function PublicShell({
  children,
  Link,
  preview = false,
}: {
  children: ReactNode
  Link: SiteLink
  preview?: boolean
}) {
  return (
    <div className="min-h-screen bg-canvas">
      {preview && (
        <div className="bg-brand-900 px-4 py-2 text-center text-xs text-white">
          Design preview · Illustrative providers, not a live directory.
          Accounts and inquiries use the separate Next.js app.
        </div>
      )}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link href="/" className="text-ink">
            <Brand />
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-5 text-sm"
          >
            <Link
              href="/directory"
              className="hidden font-medium text-muted hover:text-brand-800 sm:block"
            >
              Find a fundi
            </Link>
            <Link
              href="/dashboard"
              className="font-medium text-muted hover:text-brand-800"
            >
              Workspace
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
            >
              List your business <ArrowUpRight className="size-4" />
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-20 border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-3 md:px-8">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Local skills. Real connections. Helping Nairobi find the right
              hands for the job.
            </p>
          </div>
          <div>
            <Heading level={3} className="mb-3 text-sm font-semibold">
              Explore FundiFind
            </Heading>
            <div className="flex flex-col items-start gap-3 text-sm text-muted">
              <Link href="/directory?category=plumbers">
                Plumbers in Nairobi
              </Link>
              <Link href="/directory?category=electricians">
                Electricians in Nairobi
              </Link>
              <Link href="/register">Join as a professional</Link>
            </div>
          </div>
          <div>
            <Heading level={3} className="mb-3 text-sm font-semibold">
              Choose with confidence
            </Heading>
            <p className="text-sm leading-relaxed text-muted">
              A verified badge indicates reviewed listing details, not a
              workmanship guarantee. Always agree on scope, price, and payment
              directly with your fundi.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-line px-5 py-5 text-xs text-muted md:px-8">
          © {new Date().getFullYear()} FundiFind. Made for Kenya. All prices in
          KES.
        </div>
      </footer>
    </div>
  )
}
function SearchBar({
  filters,
  areas,
  onSearch,
}: {
  filters: DirectoryFilters
  areas: string[]
  onSearch: (filters: DirectoryFilters) => void
}) {
  const [query, setQuery] = useState(filters.q)
  const [category, setCategory] = useState(filters.category)
  const [area, setArea] = useState(filters.area)
  useEffect(() => {
    setQuery(filters.q)
    setCategory(filters.category)
    setArea(filters.area)
  }, [filters.q, filters.category, filters.area])
  const categoryLabels: Record<string, string> = {
    "": "All services",
    plumbers: "Plumbers",
    electricians: "Electricians",
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSearch({ ...filters, q: query.trim(), category, area, page: 1 })
      }}
      className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3 shadow-sm md:flex-row md:items-center"
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 size-5 text-muted" />
        <Input
          aria-label="Search by name or service"
          placeholder="What do you need help with?"
          value={query}
          maxLength={80}
          onChange={(event) => setQuery(event.target.value)}
          className="!border-0 !bg-transparent !pl-10 !shadow-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:border-l md:border-line md:pl-3">
        <ChoiceMenu
          label="Service category"
          value={categoryLabels[category]}
          options={Object.values(categoryLabels)}
          onChange={(label) =>
            setCategory(
              Object.keys(categoryLabels).find(
                (key) => categoryLabels[key] === label,
              ) || "",
            )
          }
        />
        <MapPin className="hidden size-4 text-brand-600 sm:block" />
        <ChoiceMenu
          label="Nairobi area"
          value={area ? titleCase(area) : "All Nairobi"}
          options={["All Nairobi", ...areas.map(titleCase)]}
          onChange={(label) =>
            setArea(areas.find((value) => titleCase(value) === label) || "")
          }
        />
        <Button type="submit" className="ml-auto">
          <Search className="size-4" /> Search
        </Button>
      </div>
    </form>
  )
}
function ListingCard({
  listing,
  Link,
  saved,
  onSave,
}: {
  listing: DirectoryListing
  Link: SiteLink
  saved: boolean
  onSave: () => void
}) {
  const Icon = listing.categorySlug === "plumbers" ? Droplets : Zap
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4 p-5 pb-0">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon className="size-7" strokeWidth={1.5} />
        </div>
        <Button
          variant="ghost"
          aria-label={`${saved ? "Unsave" : "Save"} ${listing.name}`}
          aria-pressed={saved}
          onClick={onSave}
          className="!p-2"
        >
          <Heart
            className={`size-5 ${
              saved ? "fill-brand-600 text-brand-600" : "text-muted"
            }`}
          />
        </Button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">
            {listing.category}
          </span>
          {listing.featured && <Badge tone="amber">Featured</Badge>}
        </div>
        <Link
          href={`/listing/${listing.slug}`}
          className="font-display text-lg font-bold leading-snug text-ink hover:text-brand-700"
        >
          {listing.name}
        </Link>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="size-3.5" />
          {listing.area || listing.town || listing.county}, {listing.county}
        </div>
        <p className="my-4 line-clamp-2 text-sm leading-relaxed text-muted">
          {listing.description}
        </p>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {listing.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="rounded-md bg-canvas px-2 py-1 text-xs text-muted"
            >
              {service}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          {listing.verified ? (
            <span className="inline-flex items-center gap-1 text-brand-600">
              <ShieldCheck className="size-4" />
              Verified details
            </span>
          ) : (
            <span className="text-muted">Community listing</span>
          )}
          {listing.rating !== null ? (
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {listing.rating.toFixed(1)}{" "}
              <span className="text-muted">({listing.reviewCount})</span>
            </span>
          ) : (
            <span className="text-muted">No reviews yet</span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-muted">
            {listing.minPrice !== null ? (
              <>
                From{" "}
                <span className="font-semibold text-ink">
                  {money(listing.minPrice)}
                </span>
              </>
            ) : (
              "Request a quote"
            )}
          </span>
          <Link
            href={`/listing/${listing.slug}`}
            className="flex items-center gap-1 text-xs font-semibold text-brand-700"
          >
            View profile <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
export default function PublicDirectory({
  data,
  Link,
  onSearch,
  home = false,
  preview = false,
}: {
  data: DirectoryResult
  Link: SiteLink
  onSearch: (filters: DirectoryFilters) => void
  home?: boolean
  preview?: boolean
}) {
  const [saved, setSaved] = useState<string[]>([])
  const [onlySaved, setOnlySaved] = useState(false)
  const [saveNotice, setSaveNotice] = useState("")
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem("fundifind:saved") || "[]",
      )
      if (Array.isArray(value))
        setSaved(
          value
            .filter((id): id is string => typeof id === "string")
            .slice(0, 100),
        )
    } catch {}
  }, [])
  function toggle(id: string) {
    const next = saved.includes(id)
      ? saved.filter((value) => value !== id)
      : [...saved, id].slice(-100)
    setSaved(next)
    try {
      localStorage.setItem("fundifind:saved", JSON.stringify(next))
      setSaveNotice("")
    } catch {
      setSaveNotice(
        "Saved for this visit only. Browser storage is unavailable.",
      )
    }
  }
  const visible = onlySaved
    ? data.listings.filter((listing) => saved.includes(listing.id))
    : data.listings
  return (
    <PublicShell Link={Link} preview={preview}>
      <main>
        {home && (
          <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-14 md:grid-cols-2 md:px-8 md:pb-16 md:pt-16">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                <span className="size-1.5 rounded-full bg-brand-600" />
                YOUR NEIGHBOURHOOD. YOUR FUNDI.
              </div>
              <Heading
                level={1}
                className="max-w-xl font-display text-4xl font-extrabold leading-tight tracking-tight text-brand-900 md:text-6xl"
              >
                Good work starts with{" "}
                <span className="text-brand-600">the right hands.</span>
              </Heading>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
                A leaking tap. A flickering light. A home that needs a little
                care. Find plumbers and electricians near you in Nairobi.
              </p>
              <div className="mt-7 flex flex-wrap gap-5 text-xs font-medium text-brand-700">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4" />
                  Reviewed listing details
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  Local professionals
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-4" />
                  Free to browse
                </span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-brand-900">
              <img
                src="/fundi-tools.jpg"
                alt="A collection of well-used hand tools, ready for the next job"
                width={720}
                height={480}
                fetchPriority="high"
                className="aspect-square w-full object-cover opacity-80 md:aspect-auto"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-900 to-transparent px-7 pb-7 pt-16 text-white">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-brand-100">
                  <Wrench className="size-4" /> BUILT FOR EVERYDAY JOBS
                </div>
                <p className="font-display text-2xl font-semibold">
                  Small fixes.
                  <br />A big difference at home.
                </p>
              </div>
            </div>
          </section>
        )}
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          {!home && (
            <div className="pb-7 pt-10">
              <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                <Link href="/">Home</Link>
                <ChevronRight className="size-3" />
                Nairobi directory
              </div>
              <Heading
                level={1}
                className="font-display text-3xl font-bold tracking-tight"
              >
                Find your local fundi
              </Heading>
              <p className="mt-2 text-sm text-muted">
                Explore plumbers and electricians serving Nairobi.
              </p>
            </div>
          )}
          <SearchBar
            filters={data.filters}
            areas={data.areas}
            onSearch={onSearch}
          />
          {home && (
            <div className="my-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/directory?category=plumbers"
                className="flex items-center gap-4 rounded-xl border border-line bg-white p-5 transition-colors hover:border-brand-200"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Droplets className="size-6" />
                </div>
                <div className="flex-1">
                  <Heading
                    level={3}
                    className="font-display text-base font-bold"
                  >
                    Plumbers
                  </Heading>
                  <p className="mt-1 text-xs text-muted">
                    Leaks, repairs, installations & more
                  </p>
                </div>
                <ArrowUpRight className="size-5 text-brand-600" />
              </Link>
              <Link
                href="/directory?category=electricians"
                className="flex items-center gap-4 rounded-xl border border-line bg-white p-5 transition-colors hover:border-brand-200"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Zap className="size-6" />
                </div>
                <div className="flex-1">
                  <Heading
                    level={3}
                    className="font-display text-base font-bold"
                  >
                    Electricians
                  </Heading>
                  <p className="mt-1 text-xs text-muted">
                    Wiring, lighting, safety & more
                  </p>
                </div>
                <ArrowUpRight className="size-5 text-brand-600" />
              </Link>
            </div>
          )}
          <div className="mb-6 mt-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-widest text-brand-600">
                LOCAL EXPERTISE, CLOSE TO HOME
              </div>
              <Heading level={2} className="font-display text-2xl font-bold">
                {home
                  ? "Meet your neighbourhood professionals"
                  : "Nairobi professionals"}
              </Heading>
              <p className="mt-2 text-sm text-muted">
                {data.unavailable
                  ? "We’re having trouble connecting to the directory."
                  : `${data.total} ${
                      data.total === 1 ? "professional" : "professionals"
                    } match your search`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted" />
              <ChoiceMenu
                label="Sort listings"
                value={
                  {
                    recommended: "Recommended",
                    newest: "Newest first",
                    rating: "Top rated",
                  }[data.filters.sort]
                }
                options={["Recommended", "Newest first", "Top rated"]}
                onChange={(value) =>
                  onSearch({
                    ...data.filters,
                    page: 1,
                    sort:
                      value === "Top rated"
                        ? "rating"
                        : value === "Newest first"
                          ? "newest"
                          : "recommended",
                  })
                }
              />
            </div>
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              <Input
                type="checkbox"
                className="!size-4 !p-0 accent-brand-700"
                checked={data.filters.verified}
                onChange={(event) =>
                  onSearch({
                    ...data.filters,
                    verified: event.target.checked,
                    page: 1,
                  })
                }
              />
              Verified details only
            </label>
            <Button
              variant="ghost"
              className="!py-1.5 !text-xs"
              aria-pressed={onlySaved}
              onClick={() => setOnlySaved(!onlySaved)}
            >
              <Heart className="size-4" />
              {onlySaved ? "Showing saved on this page" : "Saved on this page"}
            </Button>
          </div>
          {saveNotice && (
            <p role="status" className="mb-4 text-xs text-muted">
              {saveNotice}
            </p>
          )}
          {visible.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  Link={Link}
                  saved={saved.includes(listing.id)}
                  onSave={() => toggle(listing.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center">
              <Search className="mx-auto mb-4 size-8 text-brand-500" />
              <Heading level={2} className="font-display text-xl font-bold">
                {data.unavailable
                  ? "The directory is temporarily unavailable"
                  : onlySaved
                    ? "No saved professionals on this page"
                    : "No professionals found"}
              </Heading>
              <p className="mx-auto my-3 max-w-md text-sm text-muted">
                {data.unavailable
                  ? "Please try again shortly. We won’t show outdated or invented listings."
                  : "Try another service or area, or clear your filters to explore the directory."}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setOnlySaved(false)
                  onSearch({
                    q: "",
                    category: "",
                    area: "",
                    verified: false,
                    sort: "recommended",
                    page: 1,
                  })
                }}
              >
                {data.unavailable ? "Try again" : "Clear filters"}
              </Button>
            </Card>
          )}
          {data.pages > 1 && (
            <nav
              aria-label="Search pagination"
              className="mt-8 flex items-center justify-center gap-4"
            >
              <Button
                variant="secondary"
                disabled={data.filters.page <= 1}
                onClick={() =>
                  onSearch({ ...data.filters, page: data.filters.page - 1 })
                }
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {data.filters.page} of {data.pages}
              </span>
              <Button
                variant="secondary"
                disabled={data.filters.page >= data.pages}
                onClick={() =>
                  onSearch({ ...data.filters, page: data.filters.page + 1 })
                }
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </div>
        {home && (
          <section className="mx-auto mt-16 max-w-7xl px-5 md:px-8">
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 md:p-10">
              <div className="mb-8 text-center">
                <div className="mb-2 text-xs font-medium uppercase tracking-widest text-brand-600">
                  LESS SEARCHING. MORE GETTING IT DONE.
                </div>
                <Heading level={2} className="font-display text-2xl font-bold">
                  From “who can help?” to a job well done.
                </Heading>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    icon: Search,
                    title: "Find your fit",
                    text: "Search by service and neighbourhood. Compare services, experience, and reviewed details.",
                  },
                  {
                    icon: MessageCircle,
                    title: "Talk to a professional",
                    text: "Reveal their number, connect on WhatsApp, or send an inquiry. Agree on a quote directly.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Make it happen",
                    text: "Choose who’s right for you. Agree on the job and payment before any work begins.",
                  },
                ].map(({ icon: Icon, title, text }, index) => (
                  <div key={title}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-white text-brand-700">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-xs font-medium text-brand-500">
                        0{index + 1}
                      </span>
                    </div>
                    <Heading
                      level={3}
                      className="mb-2 font-display text-base font-bold"
                    >
                      {title}
                    </Heading>
                    <p className="text-sm leading-relaxed text-muted">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </PublicShell>
  )
}
export function PublicProfile({
  listing,
  Link,
  preview = false,
}: {
  listing: PublicDetail
  Link: SiteLink
  preview?: boolean
}) {
  const [contact, setContact] = useState<{
    type: string
    number: string
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [inquiryStatus, setInquiryStatus] = useState("")
  useEffect(() => {
    setContact(null)
    setMessage("")
    setInquiryStatus("")
    if (!preview)
      void fetch(`/api/directory/${listing.slug}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "VIEW" }),
      }).catch(() => {})
  }, [listing.slug, preview])
  async function reveal(type: "PHONE_REVEAL" | "WHATSAPP_CLICK") {
    if (preview) {
      setMessage(
        "Contact details are available only in the live Next.js directory. This is an illustrative profile.",
      )
      return
    }
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch(`/api/directory/${listing.slug}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || "Could not load contact details.")
      setContact({ type, number: result.number })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.")
    } finally {
      setBusy(false)
    }
  }
  async function inquire(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (preview) {
      setInquiryStatus("Preview only. Your message has not been sent or saved.")
      return
    }
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    setInquiryStatus("")
    try {
      const response = await fetch(`/api/directory/${listing.slug}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.get("name"),
          email: fields.get("email"),
          message: fields.get("message"),
          consent: fields.get("consent") === "on",
          website: fields.get("website"),
        }),
      })
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || "Could not save your inquiry.")
      setInquiryStatus(result.message)
      form.reset()
    } catch (error) {
      setInquiryStatus(
        error instanceof Error ? error.message : "Please try again.",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <PublicShell Link={Link} preview={preview}>
      <main className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
        <div className="mb-8 flex items-center gap-2 text-xs text-muted">
          <Link href="/directory">Directory</Link>
          <ChevronRight className="size-3" />
          {listing.category}
          <ChevronRight className="size-3" />
          {listing.name}
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6 md:p-8">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge>{listing.category}</Badge>
                {listing.verified && (
                  <Badge>
                    <ShieldCheck className="size-3" />
                    Verified details
                  </Badge>
                )}
                {listing.featured && <Badge tone="amber">Featured</Badge>}
              </div>
              <Heading
                level={1}
                className="font-display text-3xl font-bold tracking-tight"
              >
                {listing.name}
              </Heading>
              <div className="my-4 flex flex-wrap gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {listing.area || listing.town || listing.county},{" "}
                  {listing.county}
                </span>
                {listing.yearsExperience !== null && (
                  <span className="flex items-center gap-1.5">
                    <Wrench className="size-4" />
                    {listing.yearsExperience} years’ experience
                  </span>
                )}
                {listing.rating !== null && (
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 text-amber-500" />
                    {listing.rating.toFixed(1)} ({listing.reviewCount} reviews)
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                {listing.description}
              </p>
              <Heading
                level={2}
                className="mb-3 mt-7 font-display text-lg font-bold"
              >
                Services offered
              </Heading>
              <div className="flex flex-wrap gap-2">
                {listing.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </Card>
            {listing.images.length > 0 && (
              <Card className="p-6">
                <Heading
                  level={2}
                  className="mb-4 font-display text-lg font-bold"
                >
                  Their work
                </Heading>
                <div className="grid grid-cols-2 gap-3">
                  {listing.images.map((image) => (
                    <img
                      key={image.url}
                      src={image.url}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </Card>
            )}
            <Card className="p-6">
              <Heading
                level={2}
                className="mb-4 font-display text-lg font-bold"
              >
                Customer reviews
              </Heading>
              {listing.reviews.length ? (
                <div className="divide-y divide-line">
                  {listing.reviews.map((review) => (
                    <div key={review.id} className="py-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{review.name}</span>
                        <span className="flex items-center gap-1 text-amber-700">
                          <Star className="size-3.5" />
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {review.comment}
                      </p>
                      {review.reply && (
                        <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm">
                          <span className="font-medium">Provider’s reply</span>
                          <p className="mt-1 text-muted">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  No approved reviews yet. Check references and discuss your
                  requirements directly.
                </p>
              )}
            </Card>
          </div>
          <aside className="space-y-5 lg:sticky lg:top-6">
            <Card className="p-6">
              <Heading level={2} className="font-display text-xl font-bold">
                Let’s get your job sorted.
              </Heading>
              <p className="mb-5 mt-2 text-sm text-muted">
                {listing.minPrice !== null
                  ? `Services from ${money(listing.minPrice)}. Agree on a final quote directly.`
                  : "Contact this professional for availability and a quote."}
              </p>
              <div className="flex flex-col gap-3">
                <Button disabled={busy} onClick={() => reveal("PHONE_REVEAL")}>
                  <Phone className="size-4" />
                  Reveal phone number
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => reveal("WHATSAPP_CLICK")}
                >
                  <MessageCircle className="size-4" />
                  Connect on WhatsApp
                </Button>
                {contact && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (contact.type === "PHONE_REVEAL")
                        window.location.href = `tel:+${contact.number}`
                      else
                        window.open(
                          `https://wa.me/${contact.number}`,
                          "_blank",
                          "noopener,noreferrer",
                        )
                    }}
                  >
                    {contact.type === "PHONE_REVEAL"
                      ? `Call +${contact.number}`
                      : "Open WhatsApp"}
                    <ArrowUpRight className="size-4" />
                  </Button>
                )}
              </div>
              {message && (
                <p role="status" className="mt-3 text-xs text-muted">
                  {message}
                </p>
              )}
              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                FundiFind does not collect job payments. Never send money before
                agreeing on the work and confirming who you’re dealing with.
              </p>
            </Card>
            <Card className="p-6">
              <Heading
                level={2}
                className="mb-4 font-display text-lg font-bold"
              >
                Send an inquiry
              </Heading>
              <form onSubmit={inquire} className="space-y-3">
                <label className="block text-xs font-medium">
                  Your name
                  <Input
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    className="mt-1.5"
                  />
                </label>
                <label className="block text-xs font-medium">
                  Email address
                  <Input
                    name="email"
                    required
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    className="mt-1.5"
                  />
                </label>
                <label className="block text-xs font-medium">
                  What do you need help with?
                  <Input
                    name="message"
                    required
                    minLength={10}
                    maxLength={2000}
                    className="mt-1.5"
                    placeholder="Describe the job and your location"
                  />
                </label>
                <div hidden>
                  <Input
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                  />
                </div>
                <label className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                  <Input
                    name="consent"
                    type="checkbox"
                    required
                    className="mt-0.5 !size-4 !p-0"
                  />
                  I consent to sharing my name, email, and message with this
                  provider.
                </label>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Please wait…" : "Send inquiry"}
                  <ArrowRight className="size-4" />
                </Button>
                {inquiryStatus && (
                  <p role="status" className="text-xs text-muted">
                    {inquiryStatus}
                  </p>
                )}
              </form>
            </Card>
            {listing.workingHours && (
              <Card className="p-6">
                <Heading
                  level={2}
                  className="mb-3 flex items-center gap-2 font-display text-lg font-bold"
                >
                  <Clock3 className="size-5" />
                  Working hours
                </Heading>
                <dl className="space-y-2 text-sm">
                  {Object.entries(listing.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between gap-3">
                      <dt className="capitalize text-muted">{day}</dt>
                      <dd>{String(hours)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </PublicShell>
  )
}
