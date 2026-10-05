import nodemailer from "nodemailer"
import { db } from "./db"
export async function deliver(id: string) {
  const item = await db.delivery.findUniqueOrThrow({ where: { id } })
  if (item.sentAt) return
  try {
    if (item.channel === "sms") {
      // Africa's Talking adapter is intentionally not integrated yet.
      if (
        process.env.NODE_ENV === "production" ||
        process.env.SMS_PROVIDER !== "stub"
      )
        throw new Error(
          "SMS adapter must be configured before production phone verification.",
        )
      console.info(`[LOCAL SMS STUB] ${item.recipient}: ${item.body}`)
    } else if (
      process.env.EMAIL_TRANSPORT === "console" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.info(
        `[LOCAL EMAIL] To ${item.recipient}\n${item.subject}\n${item.body}`,
      )
    } else {
      if (!process.env.SMTP_HOST || !process.env.EMAIL_FROM)
        throw new Error("Configure SMTP delivery.")
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      })
      await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to: item.recipient,
        subject: item.subject || "FundiFind",
        text: item.body,
      })
    }
    await db.delivery.update({
      where: { id },
      data: { sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
    })
  } catch {
    await db.delivery.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastError: "Delivery failed; check provider configuration.",
      },
    })
    // Keep a durable, retryable outbox record; don't undo account creation.
  }
}
