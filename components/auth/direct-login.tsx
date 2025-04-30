"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Icons } from "@/components/ui/icons"

export function DirectLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log("[Direct Login] Attempting login with:", email)

      // Clear any existing session data first
      await supabase.auth.signOut()

      // Direct login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      console.log("[Direct Login] Success:", data.user?.email)
      setSuccess(true)

      // Wait a moment before redirecting
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } catch (err: any) {
      console.error("[Direct Login] Error:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border border-yellow-500 rounded-md mt-4">
      <h3 className="font-medium">Try Direct Login</h3>
      <p className="text-sm text-muted-foreground">
        If you're having trouble with the regular login, try this simplified method.
      </p>

      <form onSubmit={handleDirectLogin} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/20 text-green-700 border-green-500">
            <AlertDescription>Login successful! Redirecting...</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="direct-email">Email</Label>
          <Input
            id="direct-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="direct-password">Password</Label>
          <Input
            id="direct-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
