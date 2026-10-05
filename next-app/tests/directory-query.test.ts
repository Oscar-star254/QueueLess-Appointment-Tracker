import test from "node:test"
import assert from "node:assert/strict"
import {
  escapeSearchTerm,
  parseSearch,
  publicSelect,
  publishedWhere,
  searchWhere,
} from "../lib/directory-query"
test("public search validates and bounds all URL filters", () => {
  assert.deepEqual(parseSearch({}), {
    q: "",
    category: "",
    area: "",
    verified: false,
    sort: "recommended",
    page: 1,
  })
  assert.equal(
    parseSearch({ q: "  leak  ", verified: "true", page: "2" }).q,
    "leak",
  )
  for (const input of [
    { page: "0" },
    { page: "1.5" },
    { page: "1001" },
    { q: "a".repeat(81) },
    { category: "untrusted" },
    { area: "<script>" },
    { verified: "yes" },
    { sort: "unsafe" },
    { ownerId: "private" },
  ])
    assert.throws(() => parseSearch(input))
})
test("public search treats SQL wildcard characters as literal text", () => {
  const query = "50%_leak\\repair"
  const escaped = "50\\%\\_leak\\\\repair"
  assert.equal(escapeSearchTerm(query), escaped)
  assert.deepEqual(searchWhere(parseSearch({ q: query })).OR, [
    { name: { contains: escaped, mode: "insensitive" } },
    { description: { contains: escaped, mode: "insensitive" } },
    { services: { has: query.toLowerCase() } },
  ])
})
test("every public query requires publication, paid expiry, and a verified unsuspended account", () => {
  const now = new Date()
  const where = publishedWhere(now)
  assert.equal(where.status, "ACTIVE")
  assert.deepEqual(where.expiresAt, { gt: now })
  assert.deepEqual(where.owner, {
    suspendedAt: null,
    emailVerified: { not: null },
    phoneVerified: { not: null },
  })
  const filtered = searchWhere(
    parseSearch({ category: "plumbers", area: "westlands", verified: "true" }),
    now,
  )
  assert.deepEqual(filtered.category, { slug: "plumbers", active: true })
  assert.deepEqual(filtered.county, { slug: "nairobi" })
  assert.deepEqual(filtered.area, { slug: "westlands" })
  assert.equal(filtered.verified, true)
})
test("the public projection never includes private contact or identity data", () => {
  for (const field of [
    "phone",
    "whatsapp",
    "email",
    "owner",
    "ownerId",
    "verificationDocumentKey",
    "logoKey",
    "socialLinks",
  ])
    assert.equal(field in publicSelect, false, field)
})
test(
  "published directory queries and contact/inquiry routes protect private and unpublished data",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const { randomUUID, randomInt } = await import("node:crypto")
    const { db } = await import("../lib/db")
    const { searchDirectory, listingDetail } = await import("../lib/directory")
    const { POST: contact } = await import(
      "../app/api/directory/[slug]/contact/route"
    )
    const { POST: inquire } = await import(
      "../app/api/directory/[slug]/inquiry/route"
    )
    const tag = `directory-${randomUUID()}`
    const now = new Date()
    const later = new Date(now.getTime() + 86400000)
    const origin = "http://localhost:3000"
    const previousOrigin = process.env.NEXTAUTH_URL
    process.env.NEXTAUTH_URL = origin
    let ownerId: string | undefined
    try {
      const category = await db.category.upsert({
        where: { slug: "plumbers" },
        update: {},
        create: { name: "Plumbers", slug: "plumbers" },
      })
      const county = await db.county.upsert({
        where: { slug: "nairobi" },
        update: {},
        create: { code: 47, name: "Nairobi", slug: "nairobi" },
      })
      const owner = await db.user.create({
        data: {
          name: "Directory test provider",
          email: `${tag}@example.test`,
          phone: `2547${randomInt(100000000).toString().padStart(8, "0")}`,
          passwordHash: "unusable-test-password",
          emailVerified: now,
          phoneVerified: now,
        },
      })
      ownerId = owner.id
      const base = {
        ownerId: owner.id,
        categoryId: category.id,
        countyId: county.id,
        description: "Local plumbing repairs",
        services: ["leak repairs"],
        phone: "254700000001",
        whatsapp: "254700000002",
        expiresAt: later,
      }
      const featured = await db.listing.create({
        data: {
          ...base,
          name: `${tag} featured`,
          slug: `${tag}-featured`,
          status: "ACTIVE",
          featuredUntil: later,
        },
      })
      await db.listing.create({
        data: {
          ...base,
          name: `${tag} 50%_repair`,
          slug: `${tag}-literal`,
          status: "ACTIVE",
        },
      })
      const draft = await db.listing.create({
        data: {
          ...base,
          name: `${tag} draft`,
          slug: `${tag}-draft`,
          status: "DRAFT",
        },
      })
      const results = await searchDirectory(parseSearch({ q: tag }))
      assert.equal(results.total, 2)
      assert.equal(results.listings.length, 2)
      assert.equal(results.listings[0].id, featured.id)
      const literal = await searchDirectory(parseSearch({ q: `${tag} 50%_` }))
      assert.equal(literal.total, 1)
      assert.equal(literal.listings.length, 1)
      assert.equal(await listingDetail(draft.slug), null)
      await db.review.create({
        data: {
          listingId: featured.id,
          userId: owner.id,
          rating: 4,
          comment: "Approved test review",
          status: "APPROVED",
        },
      })
      const detail = await listingDetail(featured.slug)
      assert.ok(detail)
      assert.equal(detail.rating, 4)
      assert.equal(detail.reviewCount, 1)
      for (const field of [
        "phone",
        "whatsapp",
        "email",
        "ownerId",
        "verificationDocumentKey",
      ])
        assert.equal(field in detail, false, field)
      const context = { params: Promise.resolve({ slug: featured.slug }) }
      function request(action: string, body: unknown, requestOrigin = origin) {
        return new Request(
          `${origin}/api/directory/${featured.slug}/${action}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: requestOrigin,
            },
            body: JSON.stringify(body),
          },
        )
      }
      assert.equal(
        (
          await contact(
            request(
              "contact",
              { type: "PHONE_REVEAL" },
              "https://invalid.example",
            ),
            context,
          )
        ).status,
        403,
      )
      const view = await contact(request("contact", { type: "VIEW" }), context)
      assert.equal(view.status, 200)
      assert.deepEqual(await view.json(), { recorded: true })
      const phone = await contact(
        request("contact", { type: "PHONE_REVEAL" }),
        context,
      )
      assert.equal(phone.status, 200)
      assert.equal((await phone.json()).number, featured.phone)
      const whatsapp = await contact(
        request("contact", { type: "WHATSAPP_CLICK" }),
        context,
      )
      assert.equal(whatsapp.status, 200)
      assert.equal((await whatsapp.json()).number, featured.whatsapp)
      const inquiry = {
        name: "Test visitor",
        email: `${tag}-visitor@example.test`,
        message: "Please repair a leaking tap in Nairobi.",
        consent: true,
        website: "",
      }
      assert.equal(
        (
          await inquire(
            request("inquiry", { ...inquiry, website: "spam" }),
            context,
          )
        ).status,
        400,
      )
      assert.equal(
        (await inquire(request("inquiry", inquiry), context)).status,
        201,
      )
      assert.equal(
        await db.inquiry.count({ where: { listingId: featured.id } }),
        1,
      )
      assert.equal(
        await db.notification.count({ where: { userId: owner.id } }),
        1,
      )
      assert.equal(
        await db.leadEvent.count({ where: { listingId: featured.id } }),
        4,
      )
      await db.listing.update({
        where: { id: featured.id },
        data: { expiresAt: new Date(0) },
      })
      assert.equal(await listingDetail(featured.slug), null)
      assert.equal(
        (await contact(request("contact", { type: "PHONE_REVEAL" }), context))
          .status,
        404,
      )
      assert.equal(
        (await inquire(request("inquiry", inquiry), context)).status,
        404,
      )
      await db.user.update({
        where: { id: owner.id },
        data: { suspendedAt: now },
      })
      assert.equal((await searchDirectory(parseSearch({ q: tag }))).total, 0)
    } finally {
      if (ownerId) {
        await db.listing.deleteMany({ where: { ownerId } })
        await db.user.delete({ where: { id: ownerId } })
      }
      await db.$disconnect()
      if (previousOrigin === undefined) delete process.env.NEXTAUTH_URL
      else process.env.NEXTAUTH_URL = previousOrigin
    }
  },
)
