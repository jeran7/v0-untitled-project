"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { AuthService } from "@/lib/auth-service"

export default function AuthDebugPage() {
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({})
  const [cookieItems, setCookieItems] = useState<string>("")
  const [sessionData, setSessionData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isTestingLogin, setIsTestingLogin] = useState(false)
  const [backupAuthState, setBackupAuthState] = useState<any>(null)
  const [networkStatus, setNetworkStatus] = useState<string>("checking...")

  // Refresh local storage and cookie data
  const refreshStorageData = () => {
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

      // Get backup auth state
      const backupAuth = AuthService.getBackupAuthState()
      setBackupAuthState(backupAuth)
    }
  }

  // Check network connectivity to Supabase
  const checkNetworkStatus = async () => {
    try {
      setNetworkStatus("checking...")
      const startTime = Date.now()

      // Try to ping Supabase
      const { data, error } = await supabase.from("user_profiles").select("count").limit(1)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (error) {
        setNetworkStatus(`Error: ${error.message}`)
      } else {
        setNetworkStatus(`Connected (${responseTime}ms)`)
      }
    } catch (err: any) {
      setNetworkStatus(`Connection failed: ${err.message}`)
    }
  }

  useEffect(() => {
    refreshStorageData()
    checkNetworkStatus()
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      setError(null)
      setSuccess(null)
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      setSessionData(data)
      if (data.session) {
        setSuccess("Session found!")
      } else {
        setError("No active session found")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const refreshSession = async () => {
    try {
      setError(null)
      setSuccess(null)
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      setSessionData(data)
      if (data.session) {
        setSuccess("Session refreshed successfully!")
      } else {
        setError("Could not refresh session")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const clearStorage = () => {
    try {
      setError(null)
      setSuccess(null)

      // Clear all Supabase related items
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("supabase") || key.includes("sb-") || key.includes("auth")) {
          localStorage.removeItem(key)
        }
      })

      refreshStorageData()
      setSuccess("Storage cleared successfully!")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const testDirectLogin = async () => {
    try {
      setError(null)
      setSuccess(null)
      setIsTestingLogin(true)

      // Clear any existing session
      await supabase.auth.signOut()

      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setSessionData({ session: data.session })
      setSuccess(`Login successful! User: ${data.user?.email}`)

      // Create backup auth
      localStorage.setItem(
        "auth-backup",
        JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          user: data.user.email,
        }),
      )

      // Refresh storage data
      refreshStorageData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsTestingLogin(false)
    }
  }

  const createBackupAuth = () => {
    try {
      if (!email) {
        setError("Please enter an email to create backup auth")
        return
      }

      localStorage.setItem(
        "auth-backup",
        JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          user: email,
        }),
      )

      refreshStorageData()
      setSuccess("Backup auth created successfully!")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const goToDashboard = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Diagnose authentication issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <h3 className="text-lg font-medium">Network Status</h3>
            <div className="flex items-center gap-2">
              <div className="bg-muted p-2 rounded-md flex-1">{networkStatus}</div>
              <Button onClick={checkNetworkStatus} size="sm">
                Check
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Session Check</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={checkSession}>Check Session</Button>
              <Button onClick={refreshSession} variant="outline">
                Refresh Session
              </Button>
              <Button onClick={clearStorage} variant="destructive">
                Clear Auth Storage
              </Button>
              <Button onClick={refreshStorageData} variant="secondary">
                Refresh Data
              </Button>
              <Button onClick={goToDashboard}>Go to Dashboard</Button>
            </div>

            {sessionData && (
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-40 mt-2">
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

          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-medium">Test Direct Login</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-password">Password</Label>
                <Input
                  id="test-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={testDirectLogin} disabled={isTestingLogin || !email || !password}>
                  {isTestingLogin ? "Testing..." : "Test Login"}
                </Button>
                <Button onClick={createBackupAuth} variant="outline" disabled={!email}>
                  Create Backup Auth
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-medium">Backup Auth State</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-40">
              <pre>{JSON.stringify(backupAuthState, null, 2) || "No backup auth found"}</pre>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
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
