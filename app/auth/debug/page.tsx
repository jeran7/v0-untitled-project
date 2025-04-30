"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"

export default function AuthDebugPage() {
  const { user, session, isLoading } = useAuth()
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({})
  const [cookieItems, setCookieItems] = useState<string>("")
  const [sessionData, setSessionData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get localStorage items
    if (typeof window !== "undefined") {
      const items: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          // Mask sensitive data
          const value = localStorage.getItem(key) || ""
          items[key] = key.includes("token") || key.includes("auth") ? value.substring(0, 20) + "..." : value
        }
      }
      setLocalStorageItems(items)

      // Get cookies
      setCookieItems(document.cookie)
    }
  }, [])

  const checkSession = async () => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      setSessionData(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const refreshSession = async () => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      setSessionData(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Diagnose authentication issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Auth Context State</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-40">
              <pre>{JSON.stringify({ user: user?.email, isLoading, hasSession: !!session }, null, 2)}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Session Check</h3>
            <div className="flex space-x-2">
              <Button onClick={checkSession}>Check Session</Button>
              <Button onClick={refreshSession} variant="outline">
                Refresh Session
              </Button>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {sessionData && (
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-40">
                <pre>
                  {JSON.stringify(
                    {
                      hasSession: !!sessionData.session,
                      email: sessionData.session?.user?.email,
                      expiresAt: sessionData.session?.expires_at,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">LocalStorage Items</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-40">
              <pre>{JSON.stringify(localStorageItems, null, 2)}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Cookies</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-40">
              <pre>{cookieItems || "No cookies found"}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
