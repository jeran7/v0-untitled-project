import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Create a Supabase client for middleware
function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware")
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Changed to true to ensure session persistence
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-middleware-request": "true",
      },
    },
  })
}

// List of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
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

// Check for backup auth in cookies
function hasBackupAuth(request: NextRequest) {
  try {
    const authBackup = request.cookies.get("auth-backup")?.value
    if (!authBackup) return false

    const data = JSON.parse(authBackup)
    const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000

    return data.authenticated && isRecent
  } catch (e) {
    console.error("Error checking backup auth:", e)
    return false
  }
}

export async function middleware(request: NextRequest) {
  try {
    // Create response to modify
    const response = NextResponse.next()

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

    // Create a Supabase client configured for middleware
    const supabase = createMiddlewareClient(request, response)
    if (!supabase) {
      console.error("Failed to create Supabase client in middleware")
      return NextResponse.next() // Continue anyway to avoid blocking users
    }

    // Try to get the session
    let session = null
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Middleware session error:", error.message)
      } else {
        session = data.session
        console.log("Middleware session check:", session ? "Found session" : "No session")
      }
    } catch (error: any) {
      console.error("Error getting session in middleware:", error.message)
      // Continue with null session
    }

    // Check if the current route is protected
    const isProtectedRoute = !isPublicPath(pathname)

    // If user is not signed in and trying to access protected routes
    if (!session && isProtectedRoute) {
      // Check for backup auth
      if (hasBackupAuth(request)) {
        console.log("Middleware: Using backup auth for protected route")
        return NextResponse.next()
      }

      console.log("Middleware: User is not signed in and trying to access protected route, redirecting to login")

      // Store the original URL to redirect back after login
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", pathname)

      return NextResponse.redirect(redirectUrl)
    }

    // Add auth session to response headers for server components
    if (session) {
      response.headers.set("x-supabase-auth", "authenticated")

      // Set a cookie to help with auth persistence
      const authCookie = {
        authenticated: true,
        timestamp: Date.now(),
        userId: session.user.id,
      }

      response.cookies.set("auth-backup", JSON.stringify(authCookie), {
        httpOnly: false, // Allow JavaScript access
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })
    }

    // Allow the request to continue
    return response
  } catch (error: any) {
    console.error("Middleware error:", error.message)

    // In case of error, allow the request to continue to avoid blocking the user
    return NextResponse.next()
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
