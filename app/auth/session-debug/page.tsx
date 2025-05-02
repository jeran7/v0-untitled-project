"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function SessionDebugPage() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [backupAuth, setBackupAuth] = useState<any>(null)
  const [cookies, setCookies] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchSessionData() {
      try {
        // Get session from Supabase
        const { data } = await supabase.auth.getSession()
        setSessionData(data)

        // Get backup auth from localStorage
        try {
          const backup = localStorage.getItem("auth-backup")
          if (backup) {
            setBackupAuth(JSON.parse(backup))
          }
        } catch (e) {
          console.error("Could not get backup auth", e)
        }

        // Get cookies
        const cookieObj: Record<string, string> = {}
        document.cookie.split(";").forEach((cookie) => {
          const [name, value] = cookie.trim().split("=")
          cookieObj[name] = value
        })
        setCookies(cookieObj)
      } catch (error) {
        console.error("Error fetching session data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [])

  const refreshSession = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.auth.refreshSession()
      setSessionData(data)
      toast({
        title: "Session refreshed",
        description: data.session ? "Session successfully refreshed" : "No active session to refresh",
      })
    } catch (error) {
      console.error("Error refreshing session:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearBackupAuth = () => {
    try {
      localStorage.removeItem("auth-backup")
      document.cookie = "auth-backup=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      setBackupAuth(null)
      toast({
        title: "Backup auth cleared",
        description: "Backup authentication data has been removed",
      })
    } catch (e) {
      console.error("Could not clear backup auth", e)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Session Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Current authentication session information</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-40 bg-muted rounded-md"></div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Session:</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-sm">
                    {JSON.stringify(sessionData, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button onClick={refreshSession}>Refresh Session</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup Authentication</CardTitle>
            <CardDescription>Fallback authentication data stored in localStorage</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-20 bg-muted rounded-md"></div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Backup Auth:</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-40 text-sm">
                    {backupAuth ? JSON.stringify(backupAuth, null, 2) : "No backup auth found"}
                  </pre>
                </div>
                {backupAuth && (
                  <Button variant="destructive" onClick={clearBackupAuth}>
                    Clear Backup Auth
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookies</CardTitle>
            <CardDescription>Authentication-related cookies</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-20 bg-muted rounded-md"></div>
            ) : (
              <div>
                <h3 className="text-lg font-medium">Cookies:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-40 text-sm">
                  {JSON.stringify(cookies, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
