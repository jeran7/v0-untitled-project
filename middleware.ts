import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/simplified-login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/debug",
]

// Check if a path is public
function isPublicPath(path: string) {
  return publicRoutes.some((route) => path === route || path.startsWith(`${route}/`))
}

// Check for backup auth in cookies or localStorage
function hasBackupAuth(request: NextRequest) {
  try {
    // We can't access localStorage in middleware, so we'll check for a cookie
    const authBackup = request.cookies.get("auth-backup")?.value
    if (authBackup) {
      const data = JSON.parse(authBackup)
      const isRecent = Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000 // 7 days
      return data.authenticated && isRecent
    }
    return false
  } catch (e) {
    return false
  }
}

export async function middleware(request: NextRequest) {
  try {
    // Get the pathname from the URL
    const { pathname } = request.nextUrl

    // Skip middleware for static files, api routes, and public routes
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/static") ||
      pathname.includes(".") ||
      isPublicPath(pathname)
    ) {
      return NextResponse.next()
    }

    // Check for auth cookie
    const hasAuthCookie =
      request.cookies.has("sb-auth-token") || request.cookies.has("supabase-auth-token") || hasBackupAuth(request)

    // If no auth cookie, redirect to simplified login
    if (!hasAuthCookie) {
      console.log("Middleware: No auth cookie found, redirecting to simplified login")
      const redirectUrl = new URL("/auth/simplified-login", request.url)
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Allow the request to continue
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to continue
    return NextResponse.next()
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
