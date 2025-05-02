"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"
import { AuthService } from "@/lib/auth-service"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const redirectCount = Number.parseInt(searchParams.get("redirectCount") || "0", 10)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showBackupAuth, setShowBackupAuth] = useState(false)
  const { toast } = useToast()

  // Check for redirect loops
  useEffect(() => {
    if (redirectCount > 2) {
      setError("Detected a redirect loop. Please try using backup authentication or contact support.")
      setShowBackupAuth(true)
    }
  }, [redirectCount])

  // Check for backup auth state on load
  useEffect(() => {
    const backupAuth = AuthService.getBackupAuthState()
    if (backupAuth?.authenticated) {
      setShowBackupAuth(true)
    }
  }, [])

  // Update the handleSubmit function to improve error handling and user feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await AuthService.signIn(email, password)

      if (result.success) {
        setSuccess("Login successful! Redirecting...")

        // Store the successful login in localStorage to avoid unnecessary redirects
        localStorage.setItem("loginSuccess", "true")

        // Force a small delay to ensure session is properly set
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Redirect to the requested page or dashboard
        // If we're in a redirect loop, go to dashboard instead
        const safeRedirect = redirectCount > 2 ? "/dashboard" : redirect
        router.push(safeRedirect)
      } else {
        setError(result.error || "Failed to sign in")
        setShowBackupAuth(true)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred")
      setShowBackupAuth(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Set a timeout to reset loading state if OAuth redirect doesn't happen
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    } catch (err: any) {
      console.error("Google sign in error:", err)
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Set a timeout to reset loading state if OAuth redirect doesn't happen
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    } catch (err: any) {
      console.error("GitHub sign in error:", err)
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleBackupAuth = () => {
    const backupAuth = AuthService.getBackupAuthState()
    if (backupAuth?.authenticated) {
      setSuccess(`Using backup authentication for ${backupAuth.user}. Redirecting...`)

      // Store auth in localStorage and cookies
      try {
        document.cookie = `auth-backup=${JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          userId: backupAuth.userId,
        })}; path=/; max-age=86400; SameSite=Lax;`
      } catch (e) {
        console.error("Could not set auth cookie", e)
      }

      setTimeout(() => {
        // If we're in a redirect loop, go to dashboard instead
        const safeRedirect = redirectCount > 2 ? "/dashboard" : redirect
        window.location.href = safeRedirect
      }, 1500)
    } else {
      setError("No valid backup authentication found")
    }
  }

  // Add development mode bypass for testing
  const handleDevBypass = () => {
    if (process.env.NODE_ENV !== "development") return

    const devUserId = "70adc632-3d46-4689-b462-54eee42c6c7e" // Demo user ID

    // Set backup auth
    localStorage.setItem(
      "auth-backup",
      JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
        user: "demo@example.com",
        userId: devUserId,
      }),
    )

    // Set cookie
    document.cookie = `auth-backup=${JSON.stringify({
      authenticated: true,
      timestamp: Date.now(),
      userId: devUserId,
    })}; path=/; max-age=86400; SameSite=Lax;`

    setSuccess("Development bypass activated. Redirecting...")

    setTimeout(() => {
      // If we're in a redirect loop, go to dashboard instead
      const safeRedirect = redirectCount > 2 ? "/dashboard" : redirect
      window.location.href = safeRedirect
    }, 1500)
  }

  return (
    <Card className="w-full max-w-md mx-auto glass-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-2 bg-blue-500/20 border border-blue-500/50 rounded text-sm">
            <p>
              <strong>Development Mode:</strong> Use <code>demo@example.com</code> / <code>demo123</code> to login
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/20 text-green-700 border-green-500">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {redirectCount > 2 && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Authentication loop detected. Try using backup authentication or the development bypass.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {showBackupAuth && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20"
              onClick={handleBackupAuth}
            >
              Try Backup Authentication
            </Button>
          )}

          {process.env.NODE_ENV === "development" && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2 border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
              onClick={handleDevBypass}
            >
              Development Bypass
            </Button>
          )}

          <div className="pt-2">
            <Link href="/auth/debug">
              <Button type="button" variant="link" className="w-full text-sm">
                Authentication Debug
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background/90 px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="bg-background/50"
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={handleGithubSignIn}
            disabled={isLoading}
            className="bg-background/50"
          >
            <Icons.gitHub className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-2">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
