"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"

export default function SessionDebugPage() {
  const [session, setSession] = useState<any>(null)
  const [backupAuth, setBackupAuth] = useState<any>(null)
  const [cookies, setCookies] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function checkSession() {
      try {
        setLoading(true)
        setError(null)

        // Get session from Supabase
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setSession(data.session)

        // Get backup auth from localStorage
        try {
          const backup = localStorage.getItem("auth-backup")
          if (backup) {
            setBackupAuth(JSON.parse(backup))
          }
        } catch (e) {
          console.error("Error getting backup auth:", e)
        }

        // Parse cookies
        const cookieObj: Record<string, string> = {}
        document.cookie.split(";").forEach((cookie) => {
          const [name, value] = cookie.trim().split("=")
          if (name && value) {
            cookieObj[name] = value
          }
        })
        setCookies(cookieObj)
      } catch (err: any) {
        console.error("Session check error:", err)
        setError(err.message || "Failed to check session")
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [refreshKey])

  const refreshSession = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const fixSession = async () => {
    try {
      setLoading(true)

      // Force refresh the session
      await supabase.auth.refreshSession()

      // Store backup auth
      if (session?.user) {
        localStorage.setItem(
          "auth-backup",
          JSON.stringify({
            authenticated: true,
            timestamp: Date.now(),
            user: session.user.email,
            userId: session.user.id,
          }),
        )
      }

      refreshSession()
    } catch (err: any) {
      setError(err.message || "Failed to fix session")
    } finally {
      setLoading(false)
    }
  }

  const clearSession = async () => {
    try {
      setLoading(true)

      // Sign out
      await supabase.auth.signOut()

      // Clear backup auth
      localStorage.removeItem("auth-backup")

      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      refreshSession()
    } catch (err: any) {
      setError(err.message || "Failed to clear session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Session Debug Tool</span>
            <Button variant="outline" size="icon" onClick={refreshSession} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <CardDescription>Diagnose authentication and session issues</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert variant={session ? "default" : "destructive"} className="mb-4">
            {session ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{session ? "Authenticated" : "Not Authenticated"}</AlertTitle>
            <AlertDescription>
              {session ? `Logged in as ${session.user?.email}` : "No active session found"}
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="session">
            <TabsList className="mb-4">
              <TabsTrigger value="session">Session</TabsTrigger>
              <TabsTrigger value="backup">Backup Auth</TabsTrigger>
              <TabsTrigger value="cookies">Cookies</TabsTrigger>
            </TabsList>

            <TabsContent value="session">
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(session, null, 2) || "No session data"}
              </pre>
            </TabsContent>

            <TabsContent value="backup">
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(backupAuth, null, 2) || "No backup auth data"}
              </pre>
            </TabsContent>

            <TabsContent value="cookies">
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(cookies, null, 2) || "No cookies found"}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/auth/login")}>
            Go to Login
          </Button>
          <div className="space-x-2">
            <Button variant="secondary" onClick={fixSession} disabled={loading}>
              Fix Session
            </Button>
            <Button variant="destructive" onClick={clearSession} disabled={loading}>
              Clear Session
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
