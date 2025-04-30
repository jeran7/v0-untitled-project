"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Icons } from "@/components/ui/icons"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const { searchParams } = new URL(window.location.href)
        const code = searchParams.get("code")

        if (!code) {
          throw new Error("No code provided in callback URL")
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          throw error
        }

        // Redirect to dashboard on success
        router.push("/dashboard")
      } catch (err) {
        console.error("Auth callback error:", err)
        setError(err instanceof Error ? err.message : "Authentication failed")

        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-auth-pattern bg-cover bg-center">
      <div className="glass-card p-8 rounded-lg border border-border/40 backdrop-blur-[20px] bg-background/90 w-full max-w-md text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Authentication Failed</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm">Redirecting to login page...</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Completing Sign In</h1>
            <p className="text-muted-foreground">Please wait while we complete the authentication process...</p>
          </>
        )}
      </div>
    </div>
  )
}
