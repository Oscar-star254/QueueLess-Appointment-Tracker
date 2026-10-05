"use client"
import { lazy, Suspense, useState } from "react"
import {
  LayoutDashboard,
  Store,
  Users,
  Shapes,
  MapPin,
  CreditCard,
  Wallet,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Bell,
  PanelLeftClose,
  Menu,
  X,
  ShieldCheck,
  Check,
  ExternalLink,
  Download,
  TrendingUp,
  MoveUpRight,
  BookOpen,
  LogOut,
  LockKeyhole,
  Zap,
  Droplets,
  CheckCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
const RevenueChart = lazy(() => import("./RevenueChart"))
import { Badge, Brand, Button, Card, Input, Modal } from "./ui"
import { ChoiceMenu, Heading } from "./presentation"
import AuthPanel, { type AuthMode } from "./AuthPanel"

export type Actor = {
  name: string
  email: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
}
export type WorkspaceStats = {
  listings: number
  active: number
  providers: number
  pending: number
}
const navigation: {
  label: string
  icon: LucideIcon
  section?: string
  count?: string
  stage?: number
}[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Listings", icon: Store, count: "20", stage: 3 },
  { label: "Providers", icon: Users },
  { label: "Categories", icon: Shapes, stage: 5 },
  { label: "Locations", icon: MapPin, stage: 5 },
  { label: "Plans & pricing", icon: CreditCard, section: "BUSINESS", stage: 4 },
  { label: "Payments", icon: Wallet, stage: 4 },
  { label: "Reviews & reports", icon: MessageSquare, count: "3", stage: 5 },
  { label: "Roles & access", icon: ShieldCheck, section: "WORKSPACE" },
  { label: "Settings", icon: Settings },
]
const listings = [
  {
    name: "Kamau Plumbing Services",
    initials: "KP",
    category: "Plumbing",
    location: "Westlands, Nairobi",
    plan: "Professional",
    status: "Active",
    icon: Droplets,
    date: "24 Oct 2025",
  },
  {
    name: "Bright Spark Electrical",
    initials: "BS",
    category: "Electrical",
    location: "Kilimani, Nairobi",
    plan: "Premium",
    status: "Pending review",
    icon: Zap,
    date: "24 Oct 2025",
  },
  {
    name: "Mombasa Pipe Masters",
    initials: "MP",
    category: "Plumbing",
    location: "Nyali, Mombasa",
    plan: "Starter",
    status: "Active",
    icon: Droplets,
    date: "23 Oct 2025",
  },
  {
    name: "Otieno Electrical Works",
    initials: "OE",
    category: "Electrical",
    location: "Milimani, Kisumu",
    plan: "Professional",
    status: "Active",
    icon: Zap,
    date: "23 Oct 2025",
  },
]
const stageTitles = [
  "Setup, schema & authentication",
  "Public site & search",
  "Provider dashboard & listings",
  "Plans & mock payments",
  "Admin management",
  "Notifications, SEO & launch",
]

export default function Workspace({
  preview = false,
  actor,
  stats,
}: {
  preview?: boolean
  actor?: Actor
  stats?: WorkspaceStats
}) {
  const [page, setPage] = useState("Overview")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dialog, setDialog] =
    useState<"setup" | "new" | "auth" | "notifications" | "account" | "export" | null>(
      null,
    )
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [notice, setNotice] = useState("")
  const [search, setSearch] = useState("")
  const [period, setPeriod] = useState("This month")
  const [filter, setFilter] = useState("All listings")
  const [selectedListing, setSelectedListing] =
    useState<typeof listings[number] | null>(null)
  const name = actor?.name || "Alex Morgan"
  const role = actor?.role.replaceAll("_", " ").toLowerCase() || "super admin"
  const showDemo = preview
  const shownListings = (showDemo ? listings : []).filter(
    (l) =>
      `${l.name} ${l.category} ${l.location}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter !== "Pending review" || l.status === "Pending review"),
  )
  function navigate(label: string, stage?: number) {
    if (stage) {
      setNotice(
        `${label} is scheduled for Stage ${stage}. This stage covers setup, authentication, and role protection.`,
      )
    } else {
      setPage(label)
    }
    setMobileOpen(false)
  }
  function exportData() {
    const csv =
      "Business,Category,Location,Plan,Status\n" +
      shownListings
        .map((l) =>
          [l.name, l.category, l.location, l.plan, l.status]
            .map((v) => `"${v.replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\n")
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    )
    const a = document.createElement("a")
    a.href = url
    a.download = "fundifind-sample-listings.csv"
    a.click()
    URL.revokeObjectURL(url)
    setNotice(
      "Sample listings exported. This is preview data, not a production report.",
    )
    setDialog(null)
  }
  return (
    <div className="min-h-screen">
      {mobileOpen && (
        <Button
          variant="ghost"
          aria-label="Close navigation"
          className="!p-0 !font-normal !text-xs fixed inset-0 z-30 !bg-black/30 lg:!hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-white transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Brand />
          <Button
            variant="ghost"
            onClick={() => setMobileOpen(false)}
            className="!p-0 !font-normal !text-xs !text-muted lg:!hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={() => setDialog("account")}
          className="!p-0 !font-normal !text-xs mx-4 mt-3 !flex items-center !gap-2.5 !rounded-lg border border-line !p-3 !text-left"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <Store size={17} />
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold">
              FundiFind workspace
            </span>
            <span className="text-xs capitalize text-muted">{role}</span>
          </span>
          <ChevronDown size={14} className="text-muted" />
        </Button>
        <nav
          aria-label="Main navigation"
          className="mt-6 flex-1 space-y-1 overflow-y-auto px-3"
        >
          {navigation
            .filter(
              (n) =>
                !actor ||
                ["Overview", "Settings"].includes(n.label) ||
                actor.role === "SUPER_ADMIN" ||
                (actor.role === "ADMIN" && n.label !== "Roles & access") ||
                (actor.role === "MODERATOR" &&
                  ["Listings", "Reviews & reports"].includes(n.label)) ||
                (actor.role === "FINANCE" &&
                  ["Payments", "Plans & pricing"].includes(n.label)),
            )
            .map((n) => (
              <div key={n.label}>
                {n.section && (
                  <p className="px-3 pt-6 pb-2 text-xs font-semibold tracking-widest text-muted">
                    {n.section}
                  </p>
                )}
                <Button
                  variant="ghost"
                  onClick={() => navigate(n.label, n.stage)}
                  aria-current={page === n.label ? "page" : undefined}
                  className={`!p-0 !font-normal !text-xs !flex w-full items-center !gap-3 !rounded-lg !px-3 !py-2.5 !text-sm transition-colors ${
                    page === n.label
                      ? "!bg-brand-50 !font-semibold !text-brand-800"
                      : "!text-muted hover:!bg-canvas hover:!text-ink"
                  }`}
                >
                  <n.icon size={17} strokeWidth={1.7} />
                  <span className="flex-1 text-left">{n.label}</span>
                  {n.count && showDemo && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        n.label === "Reviews & reports"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-muted"
                      }`}
                    >
                      {n.count}
                    </span>
                  )}
                </Button>
              </div>
            ))}
        </nav>
        <div className="m-4 rounded-xl bg-canvas p-4">
          <span className="flex size-7 items-center justify-center rounded-lg border border-line bg-white text-brand-700">
            <BookOpen size={15} />
          </span>
          <p className="mt-2.5 text-xs font-semibold">
            A little help goes a long way.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Your guide to building a trusted directory.
          </p>
          <Button
            variant="ghost"
            onClick={() => setDialog("setup")}
            className="!p-0 !font-normal !text-xs mt-3 !flex items-center !gap-2 !text-xs !font-semibold !text-brand-700"
          >
            View setup guide <ArrowUpRight size={13} />
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={() => setDialog("account")}
          className="!p-0 !font-normal !text-xs !flex items-center !gap-3 border-t border-line !px-5 !py-4 !text-left"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900">
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold">{name}</span>
            <span className="text-xs capitalize text-muted">{role}</span>
          </span>
          <ChevronDown size={15} className="text-muted" />
        </Button>
      </aside>
      <div className="lg:ml-60">
        <header className="flex h-20 items-center justify-between border-b border-line bg-white/80 px-5 md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="!p-0 !font-normal !text-xs !text-muted lg:!hidden"
            >
              <Menu size={20} />
            </Button>
            <PanelLeftClose size={17} className="hidden text-muted lg:block" />
            <span className="hidden text-line sm:block">/</span>
            <span className="text-xs text-muted">Workspace</span>
            <ChevronRight size={13} className="text-muted" />
            <span className="text-xs font-medium">{page}</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge tone="gray">
              {preview ? (
                <>
                  <span className="sm:hidden">Preview</span>
                  <span className="hidden sm:inline">Preview workspace</span>
                </>
              ) : (
                "Stage 1"
              )}
            </Badge>
            <Button
              variant="ghost"
              onClick={() => setDialog("setup")}
              className="!p-0 !font-normal !text-xs !hidden items-center !gap-1.5 !text-xs !text-muted sm:!flex"
            >
              Setup guide <ExternalLink size={13} />
            </Button>
            <span className="h-5 border-r border-line" />
            <Button
              variant="ghost"
              onClick={() => setDialog("notifications")}
              aria-label="View notifications"
              className="!p-0 !font-normal !text-xs relative !text-muted"
            >
              <Bell size={19} />
              {showDemo && (
                <span className="absolute top-0 right-0 size-1.5 rounded-full border border-white bg-amber-500" />
              )}
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-screen-2xl p-5 md:p-8">
          {notice && (
            <div
              role="status"
              className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
            >
              {notice}
              <Button
                variant="ghost"
                className="!p-0"
                onClick={() => setNotice("")}
                aria-label="Dismiss notice"
              >
                <X size={16} />
              </Button>
            </div>
          )}
          <div className="page-enter" key={page}>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-xs text-muted">
                  <span className="size-1.5 rounded-full bg-brand-600" />
                  YOUR COMMUNITY, CONNECTED
                </p>
                <Heading
                  level={1}
                  className="font-display text-3xl font-bold tracking-tight"
                >
                  {page === "Overview"
                    ? "Your directory, at a glance."
                    : page === "Providers"
                      ? "The people behind the work."
                      : page === "Roles & access"
                        ? "The right access. For everyone."
                        : "Make yourself at home."}
                </Heading>
                <p className="mt-2 text-sm text-muted">
                  {page === "Overview"
                    ? "Good things happen when great fundis get found. Here’s how you’re doing."
                    : page === "Providers"
                      ? "Provider accounts are stored securely in PostgreSQL."
                      : page === "Roles & access"
                        ? "Clear boundaries keep your community and its data safe."
                        : "Manage your account and keep it secure."}
                </p>
              </div>
              {page === "Overview" && (
                <Button onClick={() => setDialog("new")}>
                  <Plus size={16} />
                  Add a listing
                </Button>
              )}
            </div>
            {page === "Overview" && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
                  <Stat
                    label="Total listings"
                    value={showDemo ? "1,248" : String(stats?.listings ?? 0)}
                    icon={Store}
                    change="12.8%"
                    detail={
                      showDemo ? "142 added this month" : "Stored listings"
                    }
                    demo={showDemo}
                  />
                  <Stat
                    label="Active providers"
                    value={showDemo ? "986" : String(stats?.providers ?? 0)}
                    icon={Users}
                    change="8.2%"
                    detail={
                      showDemo ? "74 new providers" : "Registered providers"
                    }
                    demo={showDemo}
                  />
                  <Stat
                    label="Revenue this month"
                    value={showDemo ? "184,500" : "—"}
                    prefix={showDemo ? "KES" : undefined}
                    icon={Wallet}
                    change="18.6%"
                    detail={
                      showDemo
                        ? "vs. KES 155,565 last month"
                        : "Payments arrive in Stage 4"
                    }
                    demo={showDemo}
                  />
                  <Stat
                    label="Pending review"
                    value={showDemo ? "24" : String(stats?.pending ?? 0)}
                    icon={ShieldCheck}
                    detail={
                      showDemo ? "Let’s get them live" : "Awaiting moderation"
                    }
                    attention
                    demo={showDemo}
                    onClick={() => navigate("Listings", 3)}
                  />
                </div>
                <div className="mb-6 grid gap-5 xl:grid-cols-3">
                  <Card className="min-w-0 p-5 xl:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Heading level={2} className="text-sm font-semibold">
                          Revenue overview
                        </Heading>
                        <p className="mt-1 text-xs text-muted">
                          {showDemo
                            ? "A little growth, every day."
                            : "Payment reporting will be available in Stage 4."}
                        </p>
                      </div>
                      <ChoiceMenu
                        label="Revenue date range"
                        value={period}
                        onChange={setPeriod}
                        options={["This month", "Last month", "Last 7 days"]}
                      />
                    </div>
                    <div className="mt-5 flex items-end gap-3">
                      <span className="font-display text-3xl font-bold tracking-tight">
                        <span className="mr-1.5 text-sm font-medium text-muted">
                          KES
                        </span>
                        {showDemo
                          ? period === "Last month"
                            ? "155,565"
                            : period === "Last 7 days"
                              ? "42,500"
                              : "184,500"
                          : "—"}
                      </span>
                      {showDemo && (
                        <span className="mb-1 flex items-center gap-1 text-xs text-brand-600">
                          <TrendingUp size={14} />
                          18.6%
                        </span>
                      )}
                    </div>
                    <div
                      className="mt-5 h-52"
                      role="img"
                      aria-label={
                        showDemo
                          ? "Illustrative revenue trend rising through October, not live payment data."
                          : "No revenue data yet."
                      }
                    >
                      {showDemo ? (
                        <Suspense
                          fallback={
                            <div
                              className="h-full animate-pulse rounded-lg bg-brand-50"
                              aria-label="Loading chart"
                            />
                          }
                        >
                          <RevenueChart period={period} />
                        </Suspense>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted">
                          No payments yet
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                      <div className="flex gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-brand-600" />
                          {period}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-brand-200" />
                          Previous period
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {showDemo
                          ? "Illustrative data · KES"
                          : "All amounts in KES"}
                      </span>
                    </div>
                  </Card>
                  <Card className="flex flex-col p-5">
                    <div className="flex items-center justify-between">
                      <Heading level={2} className="text-sm font-semibold">
                        Your launch checklist
                      </Heading>
                      <Badge>1 of 6</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Small steps. A strong foundation.
                    </p>
                    <div className="mt-5 h-1.5 rounded-full bg-brand-50">
                      <div className="h-full w-1/6 rounded-full bg-brand-600" />
                    </div>
                    <div className="mt-5 flex-1 space-y-4">
                      {stageTitles.slice(0, 4).map((s, i) => (
                        <Button
                          variant="ghost"
                          key={s}
                          onClick={() =>
                            i === 0
                              ? setDialog("setup")
                              : setNotice(
                                  `Stage ${i + 1}: ${s}. Say “continue” after this stage to begin it.`,
                                )
                          }
                          className="!p-0 !font-normal !text-xs !flex w-full items-center !gap-3 !text-left"
                        >
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                              i === 0
                                ? "bg-brand-600 text-white"
                                : "border border-line text-muted"
                            }`}
                          >
                            {i === 0 ? (
                              <Check size={13} />
                            ) : (
                              <span className="text-xs">{i + 1}</span>
                            )}
                          </span>
                          <span className="flex-1">
                            <span
                              className={`block text-xs font-medium ${
                                i === 0 ? "text-brand-700" : "text-ink"
                              }`}
                            >
                              {s}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">
                              {i === 0
                                ? "Implementation ready · database setup required"
                                : i === 1
                                  ? "Up next"
                                  : "Coming in a later stage"}
                            </span>
                          </span>
                          {i === 0 && (
                            <ChevronRight size={14} className="text-muted" />
                          )}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-5 w-full !text-xs"
                      onClick={() => setDialog("setup")}
                    >
                      View the build roadmap <ArrowRight size={14} />
                    </Button>
                  </Card>
                </div>
                <Card className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <Heading level={2} className="text-sm font-semibold">
                        Recent listings
                      </Heading>
                      <p className="mt-1 text-xs text-muted">
                        The newest businesses joining your community.
                        {showDemo ? " Sample data." : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="!px-0 !text-xs text-brand-700"
                      onClick={() => navigate("Listings", 3)}
                    >
                      View all listings <ArrowRight size={14} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line px-5 py-3">
                    <div className="relative w-full sm:w-64">
                      <Search
                        size={15}
                        className="absolute top-2.5 left-3 text-muted"
                      />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search listings…"
                        aria-label="Search recent listings"
                        className="!py-2 pl-9 !text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <ChoiceMenu
                        label="Filter recent listings"
                        value={filter}
                        onChange={setFilter}
                        options={["All listings", "Pending review"]}
                      />
                      <Button
                        variant="secondary"
                        className="!py-2 !text-xs"
                        onClick={() =>
                          showDemo
                            ? setDialog("export")
                            : setNotice("Exports will be available in Stage 5.")
                        }
                      >
                        <Download size={14} />
                        Export
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap text-left text-xs">
                      <thead className="bg-canvas/60 text-xs font-medium uppercase tracking-wide text-muted">
                        <tr>
                          {[
                            "Business",
                            "Location",
                            "Plan",
                            "Status",
                            "Date added",
                            "",
                          ].map((s, i) => (
                            <th key={i} className="px-5 py-3 font-medium">
                              {s}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shownListings.map((l) => (
                          <tr
                            key={l.name}
                            className="border-t border-line transition-colors hover:bg-canvas/70"
                          >
                            <td className="px-5 py-3.5">
                              <Button
                                variant="ghost"
                                onClick={() => setSelectedListing(l)}
                                className="!p-0 !font-normal !text-xs !flex items-center !gap-3 !text-left"
                              >
                                <span
                                  className={`flex size-9 items-center justify-center rounded-lg ${
                                    l.category === "Plumbing"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  <l.icon size={17} strokeWidth={1.5} />
                                </span>
                                <span>
                                  <span className="block font-medium">
                                    {l.name}
                                  </span>
                                  <span className="mt-1 block text-xs text-muted">
                                    {l.category}
                                  </span>
                                </span>
                              </Button>
                            </td>
                            <td className="px-5 py-4 text-muted">
                              <span className="flex items-center gap-1.5">
                                <MapPin size={12} />
                                {l.location}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <Badge tone="gray">{l.plan}</Badge>
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                tone={l.status === "Active" ? "green" : "amber"}
                              >
                                <span className="size-1 rounded-full bg-current" />
                                {l.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-muted">{l.date}</td>
                            <td className="px-5 py-4">
                              <Button
                                variant="ghost"
                                onClick={() => setSelectedListing(l)}
                                aria-label={`View ${l.name}`}
                                className="!p-0 !font-normal !text-xs !text-muted"
                              >
                                <ArrowUpRight size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {!shownListings.length && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-10 text-center text-muted"
                            >
                              {search
                                ? "No listings match your search."
                                : "Listing management arrives in Stage 3."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-line px-5 py-3.5 text-xs text-muted">
                    <span>
                      {shownListings.length
                        ? `Showing ${shownListings.length} sample listings`
                        : "No listings to show"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={12} />
                      Built for trusted local connections
                    </span>
                  </div>
                </Card>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                  <span>Made for Kenya. Built for community.</span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-brand-600" />
                    {preview
                      ? "Design preview · Not connected to a database"
                      : "Authenticated workspace · PostgreSQL"}
                  </span>
                </div>
              </>
            )}
            {page === "Providers" && (
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="text-brand-600" />
                  <Heading level={2} className="font-semibold">
                    Provider account foundation
                  </Heading>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Registration creates a provider profile, normalizes Kenyan
                  phone numbers, and sends email verification. Account
                  management and the provider table arrive in Stage 5.
                </p>
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => {
                      setAuthMode("register")
                      setDialog("auth")
                    }}
                  >
                    Create a provider account <Plus size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setDialog("setup")}
                  >
                    Test registration
                  </Button>
                </div>
              </Card>
            )}
            {page === "Roles & access" && (
              <>
                <Card className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-brand-50 text-brand-800">
                      <tr>
                        <th className="p-5">Role</th>
                        <th className="p-5">Scope</th>
                        <th className="p-5">Server protection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "Super Admin",
                          "Site settings, admin accounts, and all management",
                        ],
                        [
                          "Admin",
                          "Listings, providers, content, and communications",
                        ],
                        ["Moderator", "Listings, reviews, and reports"],
                        ["Finance", "Payments and financial reports"],
                        ["Provider", "Own account and listings only"],
                      ].map(([r, scope]) => (
                        <tr key={r} className="border-t border-line">
                          <td className="p-5 font-medium">{r}</td>
                          <td className="p-5 text-muted">{scope}</td>
                          <td className="p-5">
                            <Badge>
                              <LockKeyhole size={12} />
                              Enforced
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                <p className="mt-4 text-xs text-muted">
                  Middleware blocks unauthorized routes; server handlers
                  re-check the current database role and suspension state. Role
                  changes revoke existing sessions.
                </p>
              </>
            )}
            {page === "Settings" && (
              <div className="grid gap-5 md:grid-cols-2">
                <Card className="p-6">
                  <Heading level={2} className="font-semibold">
                    Account & security
                  </Heading>
                  <p className="mt-2 text-sm text-muted">
                    {actor?.email || "Sign in to manage your account."}
                  </p>
                  <div className="mt-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Email verification</span>
                      <Badge tone={actor?.emailVerified ? "green" : "gray"}>
                        {actor?.emailVerified ? "Verified" : "Not verified"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phone verification</span>
                      <Badge tone={actor?.phoneVerified ? "green" : "gray"}>
                        {actor?.phoneVerified ? "Verified" : "Not verified"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAuthMode(actor ? "phone" : "login")
                        setDialog("auth")
                      }}
                    >
                      {actor ? "Verify phone" : "Sign in"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAuthMode("reset")
                        setDialog("auth")
                      }}
                    >
                      Reset password
                    </Button>
                    {actor && !actor.emailVerified && (
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          const r = await fetch(
                            "/api/account/resend-verification",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: "{}",
                            },
                          )
                          const data = await r.json()
                          setNotice(data.message || data.error)
                        }}
                      >
                        Resend verification
                      </Button>
                    )}
                  </div>
                </Card>
                <Card className="p-6">
                  <Heading level={2} className="font-semibold">
                    Workspace settings
                  </Heading>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Currency: KES
                    <br />
                    Timezone: Africa/Nairobi
                    <br />
                    Country: Kenya
                    <br />
                    Payments: Mock only (Stage 4)
                  </p>
                  <p className="mt-6 text-xs text-muted">
                    Site editing and administrator management are reserved for
                    Super Admins and arrive in Stage 5.
                  </p>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
      {dialog === "setup" && (
        <Modal
          title="A strong start for FundiFind"
          onClose={() => setDialog(null)}
        >
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Stage 1 includes the Next.js foundation, PostgreSQL schema, seed
            data, secure accounts, and role-based access. The Vite preview is
            illustrative, not an authenticated admin panel.
          </p>
          <ol className="space-y-3">
            {stageTitles.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs ${
                    i === 0
                      ? "bg-brand-100 text-brand-800"
                      : "bg-canvas text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                {s}
                {i === 0 && <Badge>Current stage</Badge>}
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-lg bg-canvas p-4 text-xs leading-7">
            <code>
              cd next-app
              <br />
              pnpm install
              <br />
              cp .env.example .env
              <br />
              pnpm db:migrate
              <br />
              pnpm db:seed
              <br />
              pnpm dev
            </code>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            First configure PostgreSQL, NEXTAUTH_SECRET, and your seed admin
            credentials. See README.md for exact instructions and tests. Never
            use demo credentials in production.
          </p>
        </Modal>
      )}
      {dialog === "new" && (
        <Modal
          title="Every great business starts somewhere."
          onClose={() => setDialog(null)}
        >
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Store size={24} />
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Listing creation arrives in Stage 3. For now, create your provider
            account and verify your contact details so you’re ready to list.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              setAuthMode("register")
              setDialog("auth")
            }}
          >
            Create provider account <ArrowRight size={16} />
          </Button>
        </Modal>
      )}
      {dialog === "auth" && (
        <Modal title="Your FundiFind account" onClose={() => setDialog(null)}>
          <AuthPanel initialMode={authMode} preview={preview} />
        </Modal>
      )}
      {dialog === "notifications" && (
        <Modal title="You’re all caught up." onClose={() => setDialog(null)}>
          <CheckCheck size={32} className="mb-4 text-brand-600" />
          <p className="text-sm text-muted">
            Notification delivery and renewal reminders will be built in Stage
            6. There are no live notifications in this preview.
          </p>
        </Modal>
      )}
      {dialog === "account" && (
        <Modal title="Your workspace" onClose={() => setDialog(null)}>
          <p className="text-sm text-muted">
            {preview
              ? "You’re viewing a sample Super Admin workspace. Sign-in requires the Next.js backend. No real identity or role is assigned in this preview."
              : `Signed in as ${name} (${role}). Your permissions are checked on the server.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setAuthMode("login")
                setDialog("auth")
              }}
            >
              {actor ? "Switch account" : "Sign in"}
              <ArrowRight size={15} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDialog(null)
                setPage("Settings")
              }}
            >
              Account settings
            </Button>
            {actor && (
              <Button
                variant="ghost"
                onClick={async () => {
                  const { csrfToken } = await fetch("/api/auth/csrf").then(
                    (r) => r.json(),
                  )
                  await fetch("/api/auth/signout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                      csrfToken,
                      callbackUrl: "/login",
                      json: "true",
                    }),
                  })
                  window.location.assign("/login")
                }}
              >
                <LogOut size={15} />
                Sign out
              </Button>
            )}
          </div>
        </Modal>
      )}
      {dialog === "export" && (
        <Modal title="Export sample listings" onClose={() => setDialog(null)}>
          <p className="text-sm leading-relaxed text-muted">
            Download the {shownListings.length} listings currently visible as a
            CSV. These are illustrative records from the design preview, not
            database records.
          </p>
          <Button className="mt-5" onClick={exportData}>
            <Download size={15} />
            Download CSV
          </Button>
        </Modal>
      )}
      {selectedListing && (
        <Modal
          title={selectedListing.name}
          onClose={() => setSelectedListing(null)}
        >
          <Badge tone="gray">Illustrative listing</Badge>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            {[
              ["Category", selectedListing.category],
              ["Location", selectedListing.location],
              ["Plan", selectedListing.plan],
              ["Status", selectedListing.status],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-muted">
            Public listing details arrive in Stage 2. Listing management arrives
            in Stage 3. No phone numbers are exposed in this preview.
          </p>
        </Modal>
      )}
    </div>
  )
}
function Stat({
  label,
  value,
  prefix,
  icon: Icon,
  change,
  detail,
  attention,
  demo,
  onClick,
}: {
  label: string
  value: string
  prefix?: string
  icon: LucideIcon
  change?: string
  detail: string
  attention?: boolean
  demo: boolean
  onClick?: () => void
}) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span
          className={`flex size-7 items-center justify-center rounded-lg ${
            attention
              ? "bg-amber-50 text-amber-700"
              : "bg-brand-50 text-brand-600"
          }`}
        >
          <Icon size={15} strokeWidth={1.7} />
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
        {prefix && (
          <span className="mr-1.5 text-xs font-medium text-muted">
            {prefix}
          </span>
        )}
        {value}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        {change && demo && (
          <span className="flex items-center gap-0.5 font-medium text-brand-600">
            <MoveUpRight size={10} />
            {change}
          </span>
        )}
        <span className="text-muted">{detail}</span>
        {attention && demo && (
          <Button
            variant="ghost"
            aria-label="Review pending listings"
            onClick={onClick}
            className="!p-0 !font-normal !text-xs ml-auto !text-amber-700"
          >
            <ArrowRight size={13} />
          </Button>
        )}
      </div>
    </Card>
  )
}
