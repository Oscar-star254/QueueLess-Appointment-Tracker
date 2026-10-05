import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
export default withAuth(
  function middleware(request) {
    const role = request.nextauth.token?.role
    if (request.nextUrl.pathname.startsWith("/admin") && role === "PROVIDER")
      return NextResponse.redirect(new URL("/forbidden", request.url))
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  },
)
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] }
