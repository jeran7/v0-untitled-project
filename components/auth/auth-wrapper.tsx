"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/auth-service"
import { SubscriptionService } from "@/lib/subscription-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthWrapperProps {
  children: React.ReactNode
  bypassSubscriptionCheck?: boolean // Add option to bypass subscription check
}

export function AuthWrapper({ children, bypassSubscriptionCheck = false }: AuthWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasSubscription, setHasSubscription] = useState(false)

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      if (isLoading) {
        console.error("Auth check timeout reached")
        setIsLoading(false)
        setError("Authentication check timed out. Please try refreshing the page.")
      }
    }, 10000)

    async function checkAuth() {
      try {
        setIsLoading(true)

        // Check if user is authenticated
        const session = await AuthService.getSession()

        if (!session) {
          // Try backup auth
          const backupAuth = AuthService.getBackupAuthState()
          if (!backupAuth?.authenticated) {
            router.push("/auth/login")
            return
          }

          // Use backup user ID if available
          if (backupAuth.userId) {
            setUserId(backupAuth.userId)
          }
        } else {
          // User is authenticated via session
          setUserId(session.user.id)
        }

        // Skip subscription check in development or if explicitly bypassed
        if (process.env.NODE_ENV === "development" || bypassSubscriptionCheck) {
          setHasSubscription(true)
          setIsLoading(false)
          return
        }

        // Check if user has an active subscription
        if (userId) {
          const { hasActiveSubscription } = await SubscriptionService.getUserSubscriptionWithPlan(userId)
          setHasSubscription(hasActiveSubscription)

          if (!hasActiveSubscription) {
            setError("Your subscription is inactive. Please update your subscription to continue.")
          }
        }
      } catch (err) {
        console.error("Auth check error:", err)
        setError("Authentication error. Please try logging in again.")
      } finally {
        clearTimeout(authTimeout)
        setIsLoading(false)
      }
    }

    checkAuth()

    return () => clearTimeout(authTimeout)
  }, [router, userId, bypassSubscriptionCheck])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/auth/login")}>Sign In Again</Button>

          {!hasSubscription && userId && (
            <Button variant="outline" onClick={() => router.push("/subscription")}>
              Update Subscription
            </Button>
          )}

          {process.env.NODE_ENV === "development" && (
            <Button
              variant="outline"
              onClick={() => {
                setError(null)
                setHasSubscription(true)
              }}
            >
              Bypass (Dev Only)
            </Button>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
