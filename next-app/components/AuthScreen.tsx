"use client"
import { Heading } from "../../src/fundi/presentation"
import AuthPanel, { type AuthMode } from "../../src/fundi/AuthPanel"
import { ShieldCheck, MapPin, ArrowUpRight } from "lucide-react"
export default function AuthScreen({
  mode = "login",
  token = "",
}: {
  mode?: AuthMode
  token?: string
}) {
  return (
    <main className="flex min-h-screen">
      <section className="hidden w-1/2 flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <span className="text-xs font-medium tracking-widest text-brand-200">
          GOOD WORK DESERVES TO BE FOUND.
        </span>
        <div>
          <span className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-brand-600">
            <ShieldCheck size={28} />
          </span>
          <Heading
            level={1}
            className="font-display text-5xl leading-tight font-bold tracking-tight"
          >
            Local expertise.
            <br />
            Real connections.
          </Heading>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-brand-200">
            A home for Kenya’s trusted plumbers and electricians. Build your
            reputation. Find your next customer.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-200">
          <MapPin size={14} />
          Made for Kenya. Built for community.
        </div>
      </section>
      <section className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <AuthPanel initialMode={mode} token={token} />
          <p className="mt-8 text-center text-xs text-muted">
            FundiFind · Stage 1 account foundation
          </p>
        </div>
      </section>
    </main>
  )
}
