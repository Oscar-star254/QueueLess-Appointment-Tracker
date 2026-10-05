import { z } from "zod"
export function normalizePhone(value: string): string {
  const compact = value.replace(/[\s()-]/g, "").replace(/^\+/, "")
  const normalized = compact.startsWith("0")
    ? `254${compact.slice(1)}`
    : compact
  if (!/^254[17]\d{8}$/.test(normalized))
    throw new Error("Enter a valid Kenyan mobile number.")
  return normalized
}
export const phoneSchema = z
  .string()
  .max(32)
  .transform((s, ctx) => {
    try {
      return normalizePhone(s)
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid Kenyan mobile number.",
      })
      return z.NEVER
    }
  })
export const emailSchema = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase().trim())
// bcrypt only processes the first 72 bytes, not 72 Unicode characters.
export const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .refine(
    (s) => new TextEncoder().encode(s).length <= 72,
    "Password must be at most 72 UTF-8 bytes.",
  )
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .refine((s) => !/[<>\x00-\x1f]/.test(s), "Use a plain-text name."),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    consent: z.literal("on"),
    website: z.string().max(0).optional(),
  })
  .strict()
const plainText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .refine((value) => !/[<>\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value), {
      message: "Use plain text without HTML.",
    })
const optionalUrl = z
  .union([z.literal(""), z.url().max(500)])
  .transform((value) => value || null)
const optionalEmail = z
  .union([z.literal(""), emailSchema])
  .transform((value) => value || null)
const optionalPhone = z
  .union([z.literal(""), phoneSchema])
  .transform((value) => value || null)
const optionalId = z
  .union([z.literal(""), z.string().cuid()])
  .transform((value) => value || null)
const optionalNumber = (minimum: number, maximum: number) =>
  z
    .union([z.literal(""), z.coerce.number().min(minimum).max(maximum)])
    .transform((value) => (value === "" ? null : value))
const hourValue = z
  .string()
  .trim()
  .max(32)
  .regex(
    /^(Closed|(?:[01]\d|2[0-3]):[0-5]\d–(?:[01]\d|2[0-3]):[0-5]\d)$/,
    {
      message: "Use HH:MM–HH:MM or Closed.",
    },
  )
export const workingHoursSchema = z
  .object({
    monday: hourValue,
    tuesday: hourValue,
    wednesday: hourValue,
    thursday: hourValue,
    friday: hourValue,
    saturday: hourValue,
    sunday: hourValue,
  })
  .strict()
export const listingSchema = z
  .object({
    name: plainText(3, 100),
    categoryId: z.string().cuid(),
    subcategoryId: optionalId,
    countyId: z.string().cuid(),
    townId: optionalId,
    areaId: optionalId,
    description: plainText(50, 3000),
    services: z
      .array(plainText(2, 80))
      .min(1)
      .max(30)
      .transform((values) => [...new Set(values)]),
    address: z
      .union([z.literal(""), plainText(3, 200)])
      .transform((value) => value || null),
    latitude: optionalNumber(-90, 90),
    longitude: optionalNumber(-180, 180),
    phone: phoneSchema,
    whatsapp: optionalPhone,
    email: optionalEmail,
    website: optionalUrl,
    minPrice: optionalNumber(0, 100000000),
    maxPrice: optionalNumber(0, 100000000),
    yearsExperience: optionalNumber(0, 80),
    workingHours: workingHoursSchema,
  })
  .strict()
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === null || maxPrice === null || maxPrice >= minPrice,
    { message: "Maximum price must be at least the minimum price." },
  )
  .refine(
    ({ latitude, longitude }) =>
      (latitude === null && longitude === null) ||
      (latitude !== null && longitude !== null),
    { message: "Add both map coordinates or leave both blank." },
  )
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
})
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/)
export const roles = [
  "PROVIDER",
  "ADMIN",
  "SUPER_ADMIN",
  "MODERATOR",
  "FINANCE",
] as const
export type AppRole = typeof roles[number]
export const permissions = {
  workspace: ["PROVIDER", "ADMIN", "SUPER_ADMIN", "MODERATOR", "FINANCE"],
  moderation: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
  payments: ["SUPER_ADMIN", "ADMIN", "FINANCE"],
  providers: ["SUPER_ADMIN", "ADMIN"],
  settings: ["SUPER_ADMIN"],
} satisfies Record<string, readonly AppRole[]>
export function canAccess(
  role: AppRole,
  permission: keyof typeof permissions,
): boolean {
  return (permissions[permission] as readonly AppRole[]).includes(role)
}
