"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"

export function LoginForm() {
  const router = useRouter()
  const { signIn, signInWithGoogle, signInWithGithub } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loginAttempted, setLoginAttempted] = useState(false)
  const [isProduction, setIsProduction] = useState(false)

  // Check if we're in production environment
  useEffect(() => {
    // Check if we're in production (deployed to Vercel)
    const isVercelProduction =
      window.location.hostname !== "localhost" && !window.location.hostname.includes("vercel.app")

    setIsProduction(isVercelProduction)

    if (isVercelProduction) {
      console.log("Running in production environment")
    }
  }, [])

  // Safety timeout to prevent the button from being stuck in loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (isLoading) {
      timeoutId = setTimeout(() => {
        console.log("Safety timeout triggered - resetting loading state")
        setIsLoading(false)
      }, 10000) // 10 second timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading])

  // Effect to handle successful login redirect
  useEffect(() => {
    if (loginAttempted && !isLoading && !error) {
      console.log("Login successful, redirecting via effect")
      // Force navigation to dashboard
      window.location.href = "/dashboard"
    }
  }, [loginAttempted, isLoading, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setLoginAttempted(false)

    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      console.log("Attempting to sign in with:", email)

      // Direct approach with Supabase client
      const result = await signIn(email, password)
      console.log("Sign in result:", result)

      if (result?.success) {
        console.log("Login successful, attempting redirect")
        setLoginAttempted(true)

        // Force a small delay to ensure session is properly set
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Try both navigation methods for maximum compatibility
        try {
          console.log("Attempting router navigation")
          router.push("/dashboard")

          // Fallback to direct navigation after a short delay
          setTimeout(() => {
            console.log("Fallback: direct navigation")
            window.location.href = "/dashboard"
          }, 1000)
        } catch (navError) {
          console.error("Router navigation failed:", navError)
          // Fallback to direct navigation
          window.location.href = "/dashboard"
        }
      } else if (result?.error) {
        console.error("Login error:", result.error)
        setError(result.error)
      } else {
        console.error("Unexpected result format:", result)
        setError("An unexpected error occurred")
      }
    } catch (err) {
      console.error("Login exception:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      // Ensure loading state is reset
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setIsLoading(true)
    try {
      signInWithGoogle().catch((err) => {
        console.error("Google sign in error:", err)
        setIsLoading(false)
      })

      // Set a timeout to reset loading state if OAuth redirect doesn't happen
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    } catch (err) {
      console.error("Google sign in error:", err)
      setIsLoading(false)
    }
  }

  const handleGithubSignIn = () => {
    setIsLoading(true)
    try {
      signInWithGithub().catch((err) => {
        console.error("GitHub sign in error:", err)
        setIsLoading(false)
      })

      // Set a timeout to reset loading state if OAuth redirect doesn't happen
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    } catch (err) {
      console.error("GitHub sign in error:", err)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto glass-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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

          {/* Manual redirect button - only shows after login attempt */}
          {loginAttempted && !isLoading && !error && (
            <Button type="button" className="w-full mt-2" onClick={() => (window.location.href = "/dashboard")}>
              Continue to Dashboard
            </Button>
          )}
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
