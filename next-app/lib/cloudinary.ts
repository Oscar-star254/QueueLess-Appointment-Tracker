import { createHash } from "node:crypto"
import { HttpError } from "./security"

function config() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  if (!cloud || !key || !secret)
    throw new HttpError(
      503,
      "Photo uploads are not configured. Add the Cloudinary environment variables.",
    )
  return { cloud, key, secret }
}

function signature(
  parameters: Record<string, string | number>,
  secret: string,
) {
  return createHash("sha1")
    .update(
      `${Object.entries(parameters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("&")}${secret}`,
    )
    .digest("hex")
}

export async function uploadListingPhoto(file: File, listingId: string) {
  const { cloud, key, secret } = config()
  const timestamp = Math.floor(Date.now() / 1000)
  const parameters = {
    folder: `fundifind/listings/${listingId}`,
    timestamp,
  }
  const body = new FormData()
  body.set("file", file)
  body.set("api_key", key)
  body.set("timestamp", String(timestamp))
  body.set("folder", parameters.folder)
  body.set("signature", signature(parameters, secret))
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    { method: "POST", body },
  )
  const result = (await response.json()) as {
    public_id?: string
    secure_url?: string
    width?: number
    height?: number
  }
  if (
    !response.ok ||
    !result.public_id ||
    !result.secure_url ||
    !result.width ||
    !result.height
  )
    throw new HttpError(502, "The photo could not be uploaded.")
  return {
    storageKey: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  }
}

export async function deleteListingPhoto(publicId: string) {
  const { cloud, key, secret } = config()
  const timestamp = Math.floor(Date.now() / 1000)
  const parameters = { public_id: publicId, timestamp }
  const body = new URLSearchParams({
    api_key: key,
    public_id: publicId,
    timestamp: String(timestamp),
    signature: signature(parameters, secret),
  })
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/destroy`,
    { method: "POST", body },
  )
  if (!response.ok)
    throw new HttpError(502, "The photo could not be removed.")
}
