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
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
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
]

export async function middleware(request: NextRequest) {
  try {
    // Create response to modify
    const response = NextResponse.next()

    // Create a Supabase client configured for middleware
    const supabase = createMiddlewareClient(request, response)

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Get the pathname from the URL
    const { pathname } = request.nextUrl

    // Check if the pathname starts with /auth
    const isAuthRoute = pathname.startsWith("/auth")

    // If user is signed in and trying to access auth routes, redirect to dashboard
    if (session && isAuthRoute) {
      console.log("Middleware: User is signed in and trying to access auth route, redirecting to dashboard")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/trades", "/analytics", "/profile", "/playbook", "/compliance"]

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    // If user is not signed in and trying to access protected routes, redirect to login
    if (!session && isProtectedRoute) {
      console.log("Middleware: User is not signed in and trying to access protected route, redirecting to login")

      // Store the original URL to redirect back after login
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirect", pathname)

      return NextResponse.redirect(redirectUrl)
    }

    // Allow the request to continue
    return response
  } catch (error) {
    console.error("Middleware error:", error)

    // In case of error, allow the request to continue to avoid blocking the user
    return NextResponse.next()
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
