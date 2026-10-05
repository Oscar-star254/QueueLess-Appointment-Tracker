import { useState } from "react"
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react"
import { Brand, Button, Input } from "./ui"
import { Heading } from "./presentation"
import { z } from "zod"

export type AuthMode = "login" | "register" | "reset" | "new-password" | "verify-email" | "phone"
export default function AuthPanel({
  initialMode = "login",
  preview = false,
  token = "",
}: {
  initialMode?: AuthMode
  preview?: boolean
  token?: string
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const titles = {
    login: "Welcome back.",
    register: "Your next customer is here.",
    reset: "Let’s get you back in.",
    "new-password": "Choose a new password.",
    "verify-email": "Verify your email.",
    phone: "Verify your phone.",
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setMessage("")
    const data = Object.fromEntries(new FormData(e.currentTarget))
    if (
      mode === "register" &&
      !/^\+?(?:254|0)[17]\d{8}$/.test(
        String(data.phone).replace(/[\s()-]/g, ""),
      )
    ) {
      setError("Enter a Kenyan mobile number, such as 0712345678.")
      return
    }
    if (
      ["register", "new-password"].includes(mode) &&
      !z.string().min(12).max(72).safeParse(data.password).success
    ) {
      setError("Use a password with 12–72 characters.")
      return
    }
    if (preview) {
      setError(
        "This is the design preview. Run the Next.js app using the Setup guide to register or sign in securely. No account has been created.",
      )
      return
    }
    setBusy(true)
    try {
      if (mode === "login") {
        const csrf = await fetch("/api/auth/csrf").then((r) => r.json())
        const response = await fetch("/api/auth/callback/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            email: String(data.email),
            password: String(data.password),
            csrfToken: csrf.csrfToken,
            callbackUrl: "/dashboard",
            json: "true",
          }),
        })
        const result = await response.json()
        if (!response.ok || !result.url || result.url.includes("error="))
          throw new Error(
            "Unable to sign in. Check your credentials or try again later.",
          )
        window.location.assign("/dashboard")
      } else {
        const endpoint =
          mode === "register"
            ? "register"
            : mode === "reset"
              ? "forgot-password"
              : mode === "new-password"
                ? "reset-password"
                : mode === "verify-email"
                  ? "verify-email"
                  : otpSent
                    ? "verify-phone"
                    : "send-otp"
        const response = await fetch(`/api/account/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            ...(["new-password", "verify-email"].includes(mode)
              ? { token }
              : {}),
          }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Please try again.")
        setMessage(result.message)
        if (mode === "phone") setOtpSent(true)
        if (mode === "register" || mode === "new-password") setMode("login")
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect. Please try again.",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <Brand />
      <Heading className="mt-7 font-display text-2xl font-bold tracking-tight">
        {titles[mode]}
      </Heading>
      <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">
        {mode === "register"
          ? "Join the community of trusted Kenyan professionals."
          : mode === "login"
            ? "Sign in to manage your FundiFind account."
            : mode === "phone"
              ? "We’ll send a six-digit code to your registered number."
              : "Keep your FundiFind account safe and secure."}
      </p>
      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800"
        >
          {message}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <>
            <label className="block text-sm font-medium">
              Full name
              <Input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                className="mt-1.5"
                placeholder="Your full name"
              />
            </label>
            <label className="block text-sm font-medium">
              Mobile number
              <Input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="mt-1.5"
                placeholder="0712 345 678"
              />
            </label>
          </>
        )}
        {["login", "register", "reset"].includes(mode) && (
          <label className="block text-sm font-medium">
            Email address
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className="mt-1.5"
              placeholder="you@example.com"
            />
          </label>
        )}
        {["login", "register", "new-password"].includes(mode) && (
          <label className="block text-sm font-medium">
            <span className="flex justify-between">
              Password
              {mode === "login" && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setMode("reset")
                    setError("")
                  }}
                  className="!p-0 !font-normal !text-xs !text-xs !text-brand-600"
                >
                  Forgot password?
                </Button>
              )}
            </span>
            <div className="relative mt-1.5">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "login" ? 1 : 12}
                maxLength={72}
                placeholder={
                  mode === "login" ? "Your password" : "At least 12 characters"
                }
                className="pr-11"
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="!p-0 !font-normal !text-xs absolute right-3 top-3 !text-muted"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </Button>
            </div>
          </label>
        )}
        {mode === "phone" && otpSent && (
          <label className="block text-sm font-medium">
            Verification code
            <Input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              maxLength={6}
              className="mt-1.5"
            />
          </label>
        )}
        {mode === "register" && (
          <label className="flex gap-2 text-xs leading-relaxed text-muted">
            <Input
              name="consent"
              type="checkbox"
              required
              className="mt-1 !size-4 shrink-0 !p-0 accent-brand-900"
            />
            I consent to FundiFind processing my name, contact details, and
            account data to provide this service. I can request access or
            deletion from the site operator.
          </label>
        )}
        <Input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="!hidden"
          aria-hidden="true"
        />
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}
          {mode === "login"
            ? "Sign in"
            : mode === "register"
              ? "Create provider account"
              : mode === "reset"
                ? "Send reset link"
                : mode === "new-password"
                  ? "Update password"
                  : mode === "verify-email"
                    ? "Confirm email address"
                    : otpSent
                      ? "Verify code"
                      : "Send verification code"}
          <ArrowRight size={16} />
        </Button>
      </form>
      {["register", "reset", "login"].includes(mode) && (
        <p className="mt-5 text-center text-sm text-muted">
          {mode === "login"
            ? "New to FundiFind? "
            : "Already have an account? "}
          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              setError("")
            }}
            className="!p-0 !font-normal !text-xs !font-medium !text-brand-700"
          >
            {mode === "login" ? "Get started" : "Sign in"}
          </Button>
        </p>
      )}
      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
        <ShieldCheck size={14} /> Your account. Your data. Always protected.
      </p>
    </div>
  )
}
