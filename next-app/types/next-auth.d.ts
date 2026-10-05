import type { DefaultSession } from "next-auth"
import type { Role } from "@prisma/client"
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: Role
      sessionVersion: number
    }
  }
  interface User {
    role: Role
    sessionVersion: number
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    sessionVersion: number
  }
}
