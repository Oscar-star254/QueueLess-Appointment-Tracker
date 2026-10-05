import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "./db"
import { loginSchema } from "./validation"
import { rateLimit, requestIdentity } from "./security"
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login", error: "/login" },
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://"),
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data
        const headers = new Headers(
          Object.entries(request.headers || {}).filter(
            ([, v]) => typeof v === "string",
          ) as [string, string][],
        )
        try {
          await rateLimit("login-email", email, 8)
          await rateLimit(
            "login-edge",
            requestIdentity(headers),
            process.env.TRUST_PROXY === "true" ? 30 : 500,
          )
        } catch {
          return null
        }
        const user = await db.user.findUnique({ where: { email } })
        // Same bcrypt cost even for unknown emails to reduce timing disclosure.
        const valid = await compare(
          password,
          user?.passwordHash ||
            "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
        )
        if (!valid || !user || user.suspendedAt || user.totpEnabled) return null
        await db.auditLog.create({
          data: {
            actorId: user.id,
            action: "AUTH_LOGIN",
            targetType: "User",
            targetId: user.id,
            ipHash: requestIdentity(headers),
          },
        })
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = user.role
        token.sessionVersion = user.sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ""
        session.user.role = token.role
        session.user.sessionVersion = token.sessionVersion
      }
      return session
    },
  },
}
