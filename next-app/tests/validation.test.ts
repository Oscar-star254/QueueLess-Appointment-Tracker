import test from "node:test"
import assert from "node:assert/strict"
import {
  normalizePhone,
  phoneSchema,
  passwordSchema,
  registerSchema,
  listingSchema,
  canAccess,
} from "../lib/validation"

test("Kenyan mobile numbers are normalized before storage", () => {
  for (const input of [
    "0712345678",
    "+254712345678",
    "254712345678",
    "0712 345 678",
    "(0712) 345-678",
  ])
    assert.equal(normalizePhone(input), "254712345678")
  assert.equal(normalizePhone("0112345678"), "254112345678")
  assert.equal(normalizePhone("+254112345678"), "254112345678")
})
test("non-Kenyan and malformed phone numbers are rejected", () => {
  for (const input of [
    "+255712345678",
    "0201234567",
    "071234567",
    "07123456789",
    "0712345678<script>",
    "",
    "2540712345678",
  ])
    assert.equal(phoneSchema.safeParse(input).success, false)
})
test("bcrypt password boundaries count UTF-8 bytes", () => {
  assert.equal(passwordSchema.safeParse("a".repeat(11)).success, false)
  assert.equal(passwordSchema.safeParse("a".repeat(12)).success, true)
  assert.equal(passwordSchema.safeParse("a".repeat(72)).success, true)
  assert.equal(passwordSchema.safeParse("a".repeat(73)).success, false)
  assert.equal(passwordSchema.safeParse("界".repeat(25)).success, false)
})
test("registration requires consent, rejects honeypot and role escalation", () => {
  const input = {
    name: "Jane Wanjiku",
    email: "JANE@example.com",
    phone: "0712345678",
    password: "correct-horse-battery",
    consent: "on",
    website: "",
  }
  const value = registerSchema.parse(input)
  assert.equal(value.email, "jane@example.com")
  assert.equal(value.phone, "254712345678")
  assert.equal(
    registerSchema.safeParse({ ...input, consent: undefined }).success,
    false,
  )
  assert.equal(
    registerSchema.safeParse({ ...input, website: "spam" }).success,
    false,
  )
  assert.equal(
    registerSchema.safeParse({ ...input, role: "SUPER_ADMIN" }).success,
    false,
  )
  assert.equal(
    registerSchema.safeParse({ ...input, name: "<script>evil</script>" })
      .success,
    false,
  )
})
test("permissions enforce least privilege", () => {
  assert.equal(canAccess("SUPER_ADMIN", "settings"), true)
  assert.equal(canAccess("ADMIN", "settings"), false)
  assert.equal(canAccess("FINANCE", "payments"), true)
  assert.equal(canAccess("MODERATOR", "payments"), false)
  assert.equal(canAccess("PROVIDER", "providers"), false)
  assert.equal(canAccess("PROVIDER", "workspace"), true)
  assert.equal(canAccess("MODERATOR", "moderation"), true)
})
test("provider listings normalize contacts and validate business rules", () => {
  const listing = {
    name: "Wanjiku Electrical Works",
    categoryId: "cm12345678901234567890123",
    subcategoryId: "",
    countyId: "cm12345678901234567890124",
    townId: "",
    areaId: "",
    description:
      "Qualified electricians providing careful residential repairs throughout Nairobi.",
    services: ["Home wiring", "Home wiring", "Safety inspections"],
    address: "Kilimani, Nairobi",
    latitude: -1.2921,
    longitude: 36.7877,
    phone: "0712 345 678",
    whatsapp: "+254712345678",
    email: "HELLO@example.com",
    website: "",
    minPrice: 1000,
    maxPrice: 5000,
    yearsExperience: 8,
    workingHours: {
      monday: "08:00–18:00",
      tuesday: "08:00–18:00",
      wednesday: "08:00–18:00",
      thursday: "08:00–18:00",
      friday: "08:00–18:00",
      saturday: "09:00–14:00",
      sunday: "Closed",
    },
  }
  const value = listingSchema.parse(listing)
  assert.equal(value.phone, "254712345678")
  assert.equal(value.email, "hello@example.com")
  assert.deepEqual(value.services, ["Home wiring", "Safety inspections"])
  assert.equal(
    listingSchema.safeParse({ ...listing, maxPrice: 500 }).success,
    false,
  )
  assert.equal(
    listingSchema.safeParse({ ...listing, longitude: "" }).success,
    false,
  )
  assert.equal(
    listingSchema.safeParse({
      ...listing,
      description: "<script>".repeat(10),
    }).success,
    false,
  )
})
