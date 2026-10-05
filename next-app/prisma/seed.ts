import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import { randomBytes } from "node:crypto"
import { emailSchema, normalizePhone, passwordSchema } from "../lib/validation"
const db = new PrismaClient()
const counties = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Meru",
  "Tharaka Nithi",
  "Embu",
  "Kitui",
  "Machakos",
  "Makueni",
  "Nyandarua",
  "Nyeri",
  "Kirinyaga",
  "Murang’a",
  "Kiambu",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo Marakwet",
  "Nandi",
  "Baringo",
  "Laikipia",
  "Nakuru",
  "Narok",
  "Kajiado",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
  "Nairobi",
]
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
const businessNames = [
  "Kamau Plumbing Services",
  "Bright Spark Electrical",
  "Mombasa Pipe Masters",
  "Otieno Electrical Works",
  "Westlands Waterworks",
  "Nairobi Power Solutions",
  "Kilimani Plumbing Co",
  "Safe Circuit Kenya",
  "Reliable Drain Experts",
  "Watts & Wires",
  "Kisumu Plumbing Pros",
  "Green Energy Electricians",
  "Nakuru Pipe Care",
  "Voltage Masters",
  "Karen Home Plumbing",
  "Thika Electrical Care",
  "Coast Leak Specialists",
  "Eldoret Spark Services",
  "Ruiru Plumbing Works",
  "Precision Power Kenya",
]
async function main() {
  const seedSamples = process.env.NODE_ENV !== "production"
  const email = emailSchema.parse(process.env.SEED_ADMIN_EMAIL)
  const password = passwordSchema.parse(process.env.SEED_ADMIN_PASSWORD)
  const phone = normalizePhone(process.env.SEED_ADMIN_PHONE || "")
  const passwordHash = await hash(password, 12)
  const samplePasswordHash = seedSamples
    ? await hash(randomBytes(24).toString("hex"), 12)
    : ""
  await db.$transaction(
    async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } })
      if (existing && existing.role !== "SUPER_ADMIN")
        throw new Error(
          "Seed admin email already belongs to another role. Refusing to elevate it.",
        )
      await tx.user.upsert({
        where: { email },
        update: {},
        create: {
          name: process.env.SEED_ADMIN_NAME || "FundiFind Administrator",
          email,
          phone,
          passwordHash,
          role: "SUPER_ADMIN",
          emailVerified: new Date(),
          phoneVerified: new Date(),
        },
      })
      for (let i = 0; i < counties.length; i++)
        await tx.county.upsert({
          where: { code: i + 1 },
          update: {},
          create: { code: i + 1, name: counties[i], slug: slug(counties[i]) },
        })
      const categoryDefinitions = [
        { name: "Plumbers", slug: "plumbers", icon: "droplets" },
        { name: "Electricians", slug: "electricians", icon: "zap" },
      ]
      const categories = []
      for (const [position, c] of categoryDefinitions.entries())
        categories.push(
          await tx.category.upsert({
            where: { slug: c.slug },
            update: {},
            create: { ...c, position },
          }),
        )
      for (const [i, subcategories] of [
        ["Repairs & maintenance", "Drainage & water systems"],
        ["Home wiring", "Solar & backup power"],
      ].entries())
        for (const name of subcategories)
          await tx.subcategory.upsert({
            where: {
              categoryId_slug: {
                categoryId: categories[i].id,
                slug: slug(name),
              },
            },
            update: {},
            create: { categoryId: categories[i].id, name, slug: slug(name) },
          })
      const planDefs = [
        {
          name: "Starter",
          slug: "starter",
          price: 500,
          durationDays: 30,
          maxPhotos: 3,
          maxServices: 5,
          priorityWeight: 0,
        },
        {
          name: "Professional",
          slug: "professional",
          price: 1500,
          durationDays: 30,
          maxPhotos: 8,
          maxServices: 15,
          priorityWeight: 10,
          badge: "Professional",
        },
        {
          name: "Premium",
          slug: "premium",
          price: 3000,
          durationDays: 30,
          maxPhotos: 15,
          maxServices: 30,
          priorityWeight: 20,
          featuredIncluded: true,
          badge: "Premium",
        },
      ]
      const plans = []
      for (const p of planDefs)
        plans.push(
          await tx.plan.upsert({
            where: { slug: p.slug },
            update: {},
            create: p,
          }),
        )
      for (const a of [
        {
          name: "Featured boost · 7 days",
          slug: "featured-7",
          price: 300,
          durationDays: 7,
          placement: "FEATURED",
        },
        {
          name: "Homepage spotlight · 14 days",
          slug: "spotlight-14",
          price: 1000,
          durationDays: 14,
          placement: "HOMEPAGE",
        },
      ])
        await tx.addon.upsert({
          where: { slug: a.slug },
          update: {},
          create: a,
        })
      const nairobi = await tx.county.findUniqueOrThrow({ where: { code: 47 } })
      const town = await tx.town.upsert({
        where: {
          countyId_slug: { countyId: nairobi.id, slug: "nairobi-city" },
        },
        update: {},
        create: {
          name: "Nairobi City",
          slug: "nairobi-city",
          countyId: nairobi.id,
        },
      })
      const areas = []
      for (const name of [
        "Westlands",
        "Kilimani",
        "Karen",
        "Lavington",
        "Nairobi CBD",
        "Kasarani",
      ])
        areas.push(
          await tx.area.upsert({
            where: { townId_slug: { townId: town.id, slug: slug(name) } },
            update: {},
            create: { name, slug: slug(name), townId: town.id },
          }),
        )
      const now = new Date()
      const end = new Date(now.getTime() + 30 * 86400000)
      for (const [i, name] of (seedSamples ? businessNames : []).entries()) {
        const provider = await tx.user.upsert({
          where: { email: `provider${i + 1}@example.com` },
          update: {},
          create: {
            name: `Sample Provider ${i + 1}`,
            email: `provider${i + 1}@example.com`,
            phone: `254711${String(i + 1).padStart(6, "0")}`,
            passwordHash: samplePasswordHash,
            emailVerified: now,
            phoneVerified: now,
            profile: { create: { businessName: name, consentAt: now } },
          },
        })
        const status = i < 14 ? "ACTIVE" : i < 18 ? "PENDING_REVIEW" : "DRAFT"
        await tx.listing.upsert({
          where: { slug: slug(name) },
          update: {},
          create: {
            name,
            slug: slug(name),
            ownerId: provider.id,
            categoryId: categories[i % 2].id,
            countyId: nairobi.id,
            townId: town.id,
            areaId: areas[i % areas.length].id,
            description: `Illustrative seed listing for ${name}. Experienced ${
              i % 2 === 0 ? "plumbing" : "electrical"
            } professionals serving Nairobi. This is demo data, not a real business endorsement.`,
            services:
              i % 2 === 0
                ? ["Leak repairs", "Pipe installation", "Drain cleaning"]
                : ["Electrical repairs", "Home wiring", "Safety inspections"],
            phone: provider.phone,
            whatsapp: provider.phone,
            minPrice: 1000,
            maxPrice: 10000,
            yearsExperience: 3 + (i % 10),
            status,
            verified: i % 3 === 0,
            planId: plans[i % 3].id,
            expiresAt: status === "ACTIVE" ? end : null,
            latitude: -1.286389,
            longitude: 36.817223,
            workingHours: {
              monday: "08:00–18:00",
              tuesday: "08:00–18:00",
              wednesday: "08:00–18:00",
              thursday: "08:00–18:00",
              friday: "08:00–18:00",
              saturday: "09:00–14:00",
              sunday: "Closed",
            },
            ...(status === "ACTIVE"
              ? {
                  subscriptions: {
                    create: {
                      planId: plans[i % 3].id,
                      startsAt: now,
                      endsAt: end,
                      status: "ACTIVE",
                    },
                  },
                }
              : {}),
          },
        })
      }
      for (const [key, value] of Object.entries({
        siteName: "FundiFind",
        currency: "KES",
        timezone: "Africa/Nairobi",
        autoApprove: false,
        reviewModeration: true,
        reminderDays: [7, 3, 1],
        maintenanceMode: false,
        defaultDurationDays: 30,
        upgradePricing: "simple",
      }))
        await tx.setting.upsert({
          where: { key },
          update: {},
          create: { key, value },
        })
      for (const t of [
        {
          key: "renewal",
          subject: "Your FundiFind listing expires soon",
          body: "Hello {{name}}, {{listingName}} expires in {{days}} days. Renew at {{url}}.",
        },
        {
          key: "receipt",
          subject: "Your FundiFind receipt",
          body: "Hello {{name}}, payment {{receipt}} of KES {{amount}} was received for {{listingName}}.",
        },
      ])
        await tx.emailTemplate.upsert({
          where: { key: t.key },
          update: {},
          create: t,
        })
      await tx.smsTemplate.upsert({
        where: { key: "renewal" },
        update: {},
        create: {
          key: "renewal",
          body: "FundiFind: {{listingName}} expires in {{days}} days. Renew: {{url}}",
        },
      })
    },
    { timeout: 60000 },
  )
  console.info(
    `Seed ready: 47 counties, 2 categories, 3 plans, 2 add-ons, ${
      seedSamples ? 20 : 0
    } illustrative listings. Admin credentials are the values you configured. Existing records were not overwritten.`,
  )
}
main()
  .catch(() => {
    console.error(
      "Seed failed. Check database connectivity and SEED_ADMIN_* values (email, Kenyan phone, password of 12–72 UTF-8 bytes).",
    )
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
