"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Icons } from "@/components/ui/icons"

export function DirectLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      console.log("Direct login: Attempting to sign in with:", email)

      // First, clear any existing session to avoid conflicts
      await supabase.auth.signOut()

      // Sign in with basic options
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log("Direct login: Success, session established")
      setSuccess("Login successful! Redirecting...")

      // Store session in localStorage manually as a backup
      if (data.session) {
        try {
          localStorage.setItem(
            "manual-auth-session",
            JSON.stringify({
              timestamp: Date.now(),
              user: data.user.email,
            }),
          )
        } catch (e) {
          console.warn("Could not store manual session backup", e)
        }
      }

      // Wait a moment to show success message
      setTimeout(() => {
        // Force navigation to dashboard
        window.location.href = "/dashboard"
      }, 1500)
    } catch (err: any) {
      console.error("Direct login error:", err)
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-md">
      <h3 className="text-sm font-medium mb-3">Direct Login (Bypass Auth Provider)</h3>

      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-3 bg-green-500/20 text-green-700 border-green-500">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleDirectLogin} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="direct-email" className="text-xs">
            Email
          </Label>
          <Input
            id="direct-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="h-8 text-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="direct-password" className="text-xs">
            Password
          </Label>
          <Input
            id="direct-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-8 text-sm"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In Directly"
          )}
        </Button>
      </form>
    </div>
  )
}
