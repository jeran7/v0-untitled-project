"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { setupSubscriptionBlocker } from "@/lib/subscription-blocker"

export default function DirectLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Set up the subscription blocker immediately
  useEffect(() => {
    setupSubscriptionBlocker()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      // First sign out to clear any existing session
      await supabase.auth.signOut()

      // Sign in with new credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage(`Logged in successfully as ${data.user.email}. Redirecting...`)

      // Store user info in localStorage as backup
      localStorage.setItem(
        "auth-backup",
        JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          user: data.user.email,
          userId: data.user.id,
        }),
      )

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  const handleEmergencyAccess = () => {
    try {
      if (!email) {
        setError("Please enter an email to create emergency access")
        return
      }

      // Create fake user ID
      const fakeUserId = "emergency-" + Math.random().toString(36).substring(2, 15)

      // Store in localStorage
      localStorage.setItem(
        "auth-backup",
        JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          user: email,
          userId: fakeUserId,
        }),
      )

      // Also create a fake session in localStorage that Supabase will recognize
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          currentSession: {
            access_token: "fake-token-" + Math.random().toString(36).substring(2, 15),
            refresh_token: "fake-refresh-" + Math.random().toString(36).substring(2, 15),
            user: {
              id: fakeUserId,
              email: email,
              role: "authenticated",
            },
            expires_at: Date.now() + 3600000, // 1 hour from now
          },
          expiresAt: Date.now() + 3600000,
        }),
      )

      setMessage("Emergency access created! Redirecting to dashboard...")

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } catch (e) {
      console.error("Error creating emergency access:", e)
      setError("Failed to create emergency access")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Direct Login</CardTitle>
          <p className="text-sm text-muted-foreground">This page bypasses complex auth flows and subscription checks</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="bg-red-500/20 text-red-700 p-3 rounded-md text-sm">{error}</div>}

            {message && <div className="bg-green-500/20 text-green-700 p-3 rounded-md text-sm">{message}</div>}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="relative w-full my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20"
              onClick={handleEmergencyAccess}
            >
              Create Emergency Access & Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
