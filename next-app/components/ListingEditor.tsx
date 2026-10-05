"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  LoaderCircle,
  MapPinned,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react"
import {
  Badge,
  Brand,
  Button,
  Card,
  FileInput,
  Input,
  Select,
  Textarea,
} from "../../src/fundi/ui"
import { Heading } from "../../src/fundi/presentation"
import type {
  EditableListing,
  ListingReferences,
} from "../../src/fundi/provider-types"

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const
const defaultHours = Object.fromEntries(
  days.map((day) => [
    day,
    day === "sunday"
      ? "Closed"
      : day === "saturday"
        ? "09:00–14:00"
        : "08:00–18:00",
  ]),
) as Record<(typeof days)[number], string>

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs leading-relaxed text-muted">
          {hint}
        </span>
      )}
    </label>
  )
}

export default function ListingEditor({
  references,
  listing,
  defaultPhone,
}: {
  references: ListingReferences
  listing?: EditableListing
  defaultPhone: string
}) {
  const router = useRouter()
  const editable = !listing || ["DRAFT", "REJECTED"].includes(listing.status)
  const [categoryId, setCategoryId] = useState(listing?.categoryId || "")
  const [countyId, setCountyId] = useState(listing?.countyId || "")
  const [townId, setTownId] = useState(listing?.townId || "")
  const [hours, setHours] = useState({
    ...defaultHours,
    ...(listing?.workingHours || {}),
  })
  const [images, setImages] = useState(listing?.images || [])
  const [busy, setBusy] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const category = references.categories.find(
    (value) => value.id === categoryId,
  )
  const county = references.counties.find((value) => value.id === countyId)
  const town = county?.towns.find((value) => value.id === townId)
  const title = listing
    ? editable
      ? "Edit your listing"
      : "Listing details"
    : "Create your listing"

  const completion = useMemo(() => {
    if (!listing) return 20
    return Math.min(
      100,
      60 +
        (listing.services.length ? 10 : 0) +
        (listing.latitude !== null ? 10 : 0) +
        (images.length ? 20 : 0),
    )
  }, [images.length, listing])

  async function request(url: string, options: RequestInit) {
    const response = await fetch(url, options)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Something went wrong.")
    return data
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editable) return
    setBusy("save")
    setError("")
    setNotice("")
    const form = new FormData(event.currentTarget)
    const payload = {
      name: form.get("name"),
      categoryId,
      subcategoryId: form.get("subcategoryId"),
      countyId,
      townId,
      areaId: form.get("areaId"),
      description: form.get("description"),
      services: String(form.get("services") || "")
        .split(/\n|,/)
        .map((service) => service.trim())
        .filter(Boolean),
      address: form.get("address"),
      latitude: form.get("latitude"),
      longitude: form.get("longitude"),
      phone: form.get("phone"),
      whatsapp: form.get("whatsapp"),
      email: form.get("email"),
      website: form.get("website"),
      minPrice: form.get("minPrice"),
      maxPrice: form.get("maxPrice"),
      yearsExperience: form.get("yearsExperience"),
      workingHours: hours,
    }
    try {
      const data = await request(
        listing
          ? `/api/provider/listings/${listing.id}`
          : "/api/provider/listings",
        {
          method: listing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      if (!listing) {
        router.push(`/dashboard/listings/${data.listing.id}`)
        router.refresh()
      } else {
        setNotice("Draft saved. Your changes are private until submission.")
        router.refresh()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.")
    } finally {
      setBusy("")
    }
  }

  async function submit() {
    if (!listing) return
    setBusy("submit")
    setError("")
    try {
      const data = await request(
        `/api/provider/listings/${listing.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      )
      setNotice(data.message)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit.")
    } finally {
      setBusy("")
    }
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!listing || !file) return
    setBusy("photo")
    setError("")
    const body = new FormData()
    body.set("photo", file)
    try {
      const data = await request(
        `/api/provider/listings/${listing.id}/photos`,
        { method: "POST", body },
      )
      setImages((current) => [...current, data.image])
      setNotice("Photo uploaded.")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.")
    } finally {
      event.target.value = ""
      setBusy("")
    }
  }

  async function removePhoto(id: string) {
    if (!listing) return
    setBusy(id)
    setError("")
    try {
      await request(`/api/provider/listings/${listing.id}/photos/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
      setImages((current) => current.filter((image) => image.id !== id))
      setNotice("Photo removed.")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not remove photo.",
      )
    } finally {
      setBusy("")
    }
  }

  async function removeListing() {
    if (!listing || !window.confirm("Delete this draft permanently?")) return
    setBusy("delete")
    try {
      await request(`/api/provider/listings/${listing.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
      router.push("/dashboard")
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete.")
      setBusy("")
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Brand />
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={16} /> Dashboard
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone={listing?.status === "REJECTED" ? "amber" : "gray"}>
                {listing?.status.replaceAll("_", " ").toLowerCase() ||
                  "New draft"}
              </Badge>
              {listing && (
                <span className="text-xs text-muted">
                  {completion}% profile complete
                </span>
              )}
            </div>
            <Heading
              level={1}
              className="mt-3 font-display text-3xl font-bold tracking-tight"
            >
              {title}
            </Heading>
            <p className="mt-2 text-sm text-muted">
              Clear details help customers choose with confidence.
            </p>
          </div>
          {listing && editable && (
            <Button
              onClick={submit}
              disabled={!!busy}
              className="sm:self-end"
            >
              {busy === "submit" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Submit for review
            </Button>
          )}
        </div>

        {listing?.rejectionReason && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <span className="font-semibold">Reviewer note:</span>{" "}
            {listing.rejectionReason}
          </div>
        )}
        {(notice || error) && (
          <div
            role={error ? "alert" : "status"}
            className={`mt-6 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-brand-200 bg-brand-50 text-brand-800"
            }`}
          >
            {error || notice}
          </div>
        )}

        <form onSubmit={save} className="mt-7 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-5 md:p-6">
              <Heading level={2} className="font-display text-lg font-bold">
                Business essentials
              </Heading>
              <p className="mt-1 text-xs text-muted">
                Tell customers what you do and how to reach you.
              </p>
              <fieldset disabled={!editable} className="mt-5 grid gap-5">
                <Field label="Business name">
                  <Input
                    name="name"
                    required
                    minLength={3}
                    maxLength={100}
                    defaultValue={listing?.name}
                    placeholder="e.g. Wanjiku Electrical Works"
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Trade">
                    <Select
                      required
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                    >
                      <option value="">Choose a trade</option>
                      {references.categories.map((value) => (
                        <option key={value.id} value={value.id}>
                          {value.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Speciality">
                    <Select
                      name="subcategoryId"
                      defaultValue={listing?.subcategoryId || ""}
                    >
                      <option value="">No speciality selected</option>
                      {category?.subcategories.map((value) => (
                        <option key={value.id} value={value.id}>
                          {value.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field
                  label="About your business"
                  hint="50–3,000 characters. Mention experience, the jobs you handle, and your service area."
                >
                  <Textarea
                    name="description"
                    required
                    minLength={50}
                    maxLength={3000}
                    rows={6}
                    defaultValue={listing?.description}
                    placeholder="Describe your experience and the kind of work customers can book…"
                  />
                </Field>
                <Field
                  label="Services"
                  hint="Enter one service per line, up to 30."
                >
                  <Textarea
                    name="services"
                    required
                    rows={5}
                    defaultValue={listing?.services.join("\n")}
                    placeholder={"Leak repairs\nPipe installation\nDrain cleaning"}
                  />
                </Field>
              </fieldset>
            </Card>

            <Card className="p-5 md:p-6">
              <div className="flex items-center gap-2">
                <MapPinned size={19} className="text-brand-600" />
                <Heading level={2} className="font-display text-lg font-bold">
                  Service location
                </Heading>
              </div>
              <fieldset
                disabled={!editable}
                className="mt-5 grid gap-5 sm:grid-cols-2"
              >
                <Field label="County">
                  <Select
                    required
                    value={countyId}
                    onChange={(event) => {
                      setCountyId(event.target.value)
                      setTownId("")
                    }}
                  >
                    <option value="">Choose a county</option>
                    {references.counties.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Town">
                  <Select
                    name="townId"
                    value={townId}
                    onChange={(event) => setTownId(event.target.value)}
                  >
                    <option value="">Choose a town</option>
                    {county?.towns.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Area">
                  <Select
                    name="areaId"
                    defaultValue={listing?.areaId || ""}
                  >
                    <option value="">Choose an area</option>
                    {town?.areas.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Street or landmark">
                  <Input
                    name="address"
                    maxLength={200}
                    defaultValue={listing?.address || ""}
                    placeholder="Near Yaya Centre"
                  />
                </Field>
                <Field label="Latitude" hint="Optional map pin coordinate.">
                  <Input
                    name="latitude"
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    defaultValue={listing?.latitude ?? ""}
                    placeholder="-1.2921"
                  />
                </Field>
                <Field label="Longitude" hint="Add both coordinates together.">
                  <Input
                    name="longitude"
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    defaultValue={listing?.longitude ?? ""}
                    placeholder="36.7877"
                  />
                </Field>
              </fieldset>
            </Card>

            <Card className="p-5 md:p-6">
              <Heading level={2} className="font-display text-lg font-bold">
                Contact and pricing
              </Heading>
              <fieldset
                disabled={!editable}
                className="mt-5 grid gap-5 sm:grid-cols-2"
              >
                <Field label="Phone number">
                  <Input
                    name="phone"
                    required
                    defaultValue={listing?.phone || defaultPhone}
                    placeholder="0712 345 678"
                  />
                </Field>
                <Field label="WhatsApp number">
                  <Input
                    name="whatsapp"
                    defaultValue={listing?.whatsapp || ""}
                    placeholder="0712 345 678"
                  />
                </Field>
                <Field label="Business email">
                  <Input
                    name="email"
                    type="email"
                    defaultValue={listing?.email || ""}
                    placeholder="hello@business.co.ke"
                  />
                </Field>
                <Field label="Website">
                  <Input
                    name="website"
                    type="url"
                    defaultValue={listing?.website || ""}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Minimum call-out (KES)">
                  <Input
                    name="minPrice"
                    type="number"
                    min={0}
                    defaultValue={listing?.minPrice ?? ""}
                    placeholder="1,000"
                  />
                </Field>
                <Field label="Typical upper price (KES)">
                  <Input
                    name="maxPrice"
                    type="number"
                    min={0}
                    defaultValue={listing?.maxPrice ?? ""}
                    placeholder="10,000"
                  />
                </Field>
                <Field label="Years of experience">
                  <Input
                    name="yearsExperience"
                    type="number"
                    min={0}
                    max={80}
                    defaultValue={listing?.yearsExperience ?? ""}
                  />
                </Field>
              </fieldset>
            </Card>

            <Card className="p-5 md:p-6">
              <Heading level={2} className="font-display text-lg font-bold">
                Working hours
              </Heading>
              <p className="mt-1 text-xs text-muted">
                Use 24-hour time, for example 08:00–18:00, or Closed.
              </p>
              <fieldset disabled={!editable} className="mt-5 grid gap-3">
                {days.map((day) => (
                  <div
                    key={day}
                    className="grid grid-cols-3 items-center gap-3"
                  >
                    <span className="text-sm capitalize">{day}</span>
                    <Input
                      className="col-span-2"
                      value={hours[day]}
                      onChange={(event) =>
                        setHours((current) => ({
                          ...current,
                          [day]: event.target.value,
                        }))
                      }
                      aria-label={`${day} working hours`}
                    />
                  </div>
                ))}
              </fieldset>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-brand-600" />
                <Heading level={2} className="font-display font-bold">
                  Work photos
                </Heading>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Add up to 5 JPG, PNG, or WebP photos. Each must be under 5 MB.
              </p>
              {!listing ? (
                <p className="mt-4 rounded-lg bg-canvas p-3 text-xs text-muted">
                  Save your draft first, then add photos.
                </p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-brand-50"
                      >
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="h-full w-full object-cover"
                        />
                        {editable && (
                          <Button
                            type="button"
                            variant="secondary"
                            aria-label="Remove photo"
                            disabled={!!busy}
                            onClick={() => removePhoto(image.id)}
                            className="absolute top-2 right-2 !p-2 opacity-95"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {editable && images.length < 5 && (
                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50 px-4 py-4 text-sm font-medium text-brand-800">
                      {busy === "photo" ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      Upload a photo
                      <FileInput
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={!!busy}
                        onChange={upload}
                      />
                    </label>
                  )}
                </>
              )}
            </Card>

            <Card className="p-5">
              <Heading level={2} className="font-display font-bold">
                Before you submit
              </Heading>
              <div className="mt-4 space-y-3">
                {[
                  "Business description is specific",
                  "Services are listed separately",
                  "Phone and location are accurate",
                  "Hours reflect your availability",
                ].map((item) => (
                  <p
                    key={item}
                    className="flex items-center gap-2 text-xs text-muted"
                  >
                    <CheckCircle2 size={15} className="text-brand-600" />
                    {item}
                  </p>
                ))}
              </div>
            </Card>

            {editable && (
              <div className="grid gap-2">
                <Button type="submit" disabled={!!busy}>
                  {busy === "save" ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save draft
                </Button>
                {listing && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!!busy}
                    onClick={removeListing}
                    className="text-red-700 hover:!bg-red-50 hover:!text-red-800"
                  >
                    <Trash2 size={15} /> Delete draft
                  </Button>
                )}
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
