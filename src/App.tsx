import { lazy, Suspense, useEffect, useState } from "react"
import type { ReactNode } from "react"
import PublicDirectory, { PublicProfile } from "./fundi/PublicDirectory"
import type { DirectoryFilters, DirectoryListing } from "./fundi/public-types"
import { Button } from "./fundi/ui"
const Workspace = lazy(() => import("./fundi/Workspace"))
const areas = [
  "westlands",
  "kilimani",
  "karen",
  "langata",
  "parklands",
  "south-b",
]
const names = [
  "Kamau Plumbing Services",
  "Bright Spark Electrical",
  "Nairobi Pipe & Drain",
  "Jua Kali Electrical",
  "Westlands Waterworks",
  "Kilimani Power Solutions",
  "Nairobi Reliable Plumbing",
  "Safe Circuit Kenya",
  "Greenline Plumbing",
  "Precision Power Kenya",
  "Kijiji Home Plumbing",
  "Mwangaza Electrical",
  "FlowRight Nairobi",
  "City Light Electricians",
  "Amani Plumbing",
  "HomeSafe Electrical",
  "Karibu Drain Services",
  "VoltCare Nairobi",
  "MajiWorks Plumbing",
  "Neighbourhood Electric",
]
const fixtures: DirectoryListing[] = names.map((name, index) => ({
  id: `preview-${index}`,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  category: index % 2 ? "Electricians" : "Plumbers",
  categorySlug: index % 2 ? "electricians" : "plumbers",
  county: "Nairobi",
  town: "Nairobi City",
  area: areas[index % areas.length]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase()),
  description:
    index % 2
      ? "Helping Nairobi homes stay safely connected. Wiring, lighting, fault finding, and everyday electrical repairs."
      : "Practical plumbing care for your home. From dripping taps to new installations, we help get things flowing again.",
  services:
    index % 2
      ? ["Wiring & repairs", "Lighting", "Fault finding"]
      : ["Leak repairs", "Drain cleaning", "Installation"],
  verified: index % 4 !== 3,
  featured: index < 2,
  yearsExperience: 4 + (index % 8),
  minPrice: index % 2 ? 1500 : 1000,
  maxPrice: null,
  rating: null,
  reviewCount: 0,
  images: [],
}))
function PreviewLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  const primary = className?.includes("bg-brand-900") ?? false
  return (
    <Button
      variant={primary ? "primary" : "ghost"}
      className={`!justify-start !text-left ${
        primary ? "" : className?.includes("p-5") ? "!p-5" : "!p-0"
      } ${className?.includes("text-lg") ? "!text-lg" : ""} ${
        className?.includes("text-xs") ? "!text-xs" : ""
      } ${className?.includes("font-bold") ? "!font-bold" : ""} ${
        className?.includes("hidden") ? "!hidden sm:!inline-flex" : ""
      } ${className || ""}`}
      onClick={() => {
        window.location.hash = href
      }}
    >
      {children}
    </Button>
  )
}
export default function App() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/")
  useEffect(() => {
    const update = () => {
      setRoute(window.location.hash.slice(1) || "/")
      window.scrollTo({ top: 0, behavior: "instant" })
    }
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  if (["/dashboard", "/login", "/register"].includes(route))
    return (
      <div>
        <div className="flex items-center justify-between border-b border-line bg-brand-50 px-5 py-2 text-xs text-brand-700">
          <span>
            Illustrative workspace · Live account creation is in next-app.
          </span>
          <Button
            variant="ghost"
            className="!py-1 !text-xs"
            onClick={() => {
              window.location.hash = "/"
            }}
          >
            Back to directory
          </Button>
        </div>
        <Suspense
          fallback={
            <div role="status" className="p-8 text-muted">
              Loading workspace…
            </div>
          }
        >
          <Workspace preview />
        </Suspense>
      </div>
    )
  const params = new URLSearchParams(route.split("?")[1])
  const filters: DirectoryFilters = {
    q: (params.get("q") || "").slice(0, 80),
    category: params.get("category") || "",
    area: params.get("area") || "",
    verified: params.get("verified") === "true",
    sort:
      params.get("sort") === "newest"
        ? "newest"
        : params.get("sort") === "rating"
          ? "rating"
          : "recommended",
    page: Math.max(1, Math.min(1000, Number(params.get("page")) || 1)),
  }
  if (route.startsWith("/listing/")) {
    const listing = fixtures.find((value) => value.slug === route.split("/")[2])
    if (listing)
      return (
        <PublicProfile
          listing={{
            ...listing,
            address: null,
            workingHours: null,
            reviews: [],
          }}
          Link={PreviewLink}
          preview
        />
      )
  }
  const matches = fixtures.filter(
    (listing) =>
      (!filters.q ||
        `${listing.name} ${listing.description} ${listing.services.join(" ")}`
          .toLowerCase()
          .includes(filters.q.toLowerCase())) &&
      (!filters.category || listing.categorySlug === filters.category) &&
      (!filters.area ||
        listing.area?.toLowerCase().replace(/ /g, "-") === filters.area) &&
      (!filters.verified || listing.verified),
  )
  if (filters.sort === "newest") matches.reverse()
  return (
    <PublicDirectory
      preview
      home={route === "/"}
      Link={PreviewLink}
      data={{
        filters,
        areas,
        total: matches.length,
        pages: Math.ceil(matches.length / 12),
        listings: matches.slice((filters.page - 1) * 12, filters.page * 12),
      }}
      onSearch={(value) => {
        window.location.hash = `/directory?${new URLSearchParams({ q: value.q, category: value.category, area: value.area, verified: String(value.verified), sort: value.sort, page: String(value.page) })}`
      }}
    />
  )
}
