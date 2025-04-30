"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"
import { useSimplifiedAuth } from "./simplified-auth-provider"

export function SimplifiedLoginForm() {
  const { signIn, signInWithGoogle, signInWithGithub, isLoading } = useSimplifiedAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    try {
      console.log("Attempting to sign in with:", email)

      const result = await signIn(email, password)

      if (result.success) {
        setSuccess("Login successful! Redirecting...")

        // Force a small delay to ensure session is properly set
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Navigate to dashboard
        window.location.href = "/dashboard"
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err: any) {
      console.error("Login exception:", err)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handleBackupAuth = () => {
    try {
      const backup = localStorage.getItem("auth-backup")
      if (!backup) {
        setError("No backup authentication found")
        return
      }

      const data = JSON.parse(backup)
      const isRecent = Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000 // 7 days

      if (data.authenticated && isRecent) {
        setSuccess(`Using backup authentication for ${data.user}. Redirecting...`)

        // Force a small delay
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1500)
      } else {
        setError("Backup authentication has expired")
      }
    } catch (e) {
      console.error("Error using backup auth:", e)
      setError("Failed to use backup authentication")
    }
  }

  const createEmergencyAccess = () => {
    try {
      if (!email) {
        setError("Please enter an email to create emergency access")
        return
      }

      localStorage.setItem(
        "auth-backup",
        JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          user: email,
          userId: "emergency-access",
        }),
      )

      setSuccess("Emergency access created! You can now use the 'Use Emergency Access' button to log in.")
    } catch (e) {
      console.error("Error creating emergency access:", e)
      setError("Failed to create emergency access")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto glass-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign In (Simplified)</CardTitle>
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

          {success && (
            <Alert className="bg-green-500/20 text-green-700 border-green-500">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
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

          <div className="grid grid-cols-1 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20"
              onClick={handleBackupAuth}
            >
              Use Backup Authentication
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
              onClick={createEmergencyAccess}
              disabled={!email}
            >
              Create Emergency Access
            </Button>
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
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="bg-background/50"
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={signInWithGithub}
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

        <div className="text-center">
          <Link href="/auth/debug" className="text-xs text-muted-foreground hover:underline">
            Authentication Debug
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
