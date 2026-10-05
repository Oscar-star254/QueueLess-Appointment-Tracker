import type { Metadata } from "next"
import "../../src/index.css"
export const metadata: Metadata = {
  title: {
    default: "FundiFind — Trusted local connections",
    template: "%s | FundiFind",
  },
  description: "Connect with trusted plumbers and electricians across Kenya.",
  robots: { index: false, follow: false },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-KE">
      <body>{children}</body>
    </html>
  )
}
