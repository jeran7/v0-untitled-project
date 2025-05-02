"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase, TABLE_NAMES } from "@/lib/supabase/client"
import { AuthService } from "@/lib/auth-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [tableStatus, setTableStatus] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loggingEnabled, setLoggingEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState("auth")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Tables to check
  const tablesToCheck = [
    TABLE_NAMES.USER_SUBSCRIPTIONS,
    TABLE_NAMES.SUBSCRIPTION_PLANS,
    TABLE_NAMES.USER_PROFILES,
    TABLE_NAMES.TRADES,
  ]

  async function checkAuth() {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if user is authenticated
      const session = await AuthService.getSession()
      const isAuthenticated = !!session

      // Get backup auth state
      const backupAuth = AuthService.getBackupAuthState()

      setAuthStatus({
        isAuthenticated,
        session: session
          ? {
              user: {
                id: session.user.id,
                email: session.user.email,
              },
              expires_at: session.expires_at,
            }
          : null,
        backupAuth,
      })

      if (isAuthenticated) {
        setSuccess("Authentication check successful. You are authenticated.")
      } else if (backupAuth?.authenticated) {
        setSuccess("No active session found, but backup authentication is available.")
      } else {
        setError("You are not authenticated. Please sign in.")
      }
    } catch (err: any) {
      console.error("Auth check error:", err)
      setError(`Authentication check failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function checkTableAccess() {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const results: Record<string, any> = {}
      let accessCount = 0

      for (const table of tablesToCheck) {
        try {
          const { data, error } = await supabase.from(table).select("count").limit(1)

          if (error) throw error

          results[table] = {
            success: true,
            count: data?.length || 0,
            message: "Access successful",
          }
          accessCount++
        } catch (err: any) {
          results[table] = {
            success: false,
            error: err.message,
            message: "Access failed",
          }
        }
      }

      setTableStatus(results)

      if (accessCount === tablesToCheck.length) {
        setSuccess(`Successfully accessed all ${tablesToCheck.length} tables.`)
      } else if (accessCount > 0) {
        setSuccess(`Successfully accessed ${accessCount} of ${tablesToCheck.length} tables.`)
      } else {
        setError("Could not access any tables. Please check your permissions.")
      }
    } catch (err: any) {
      console.error("Table access check error:", err)
      setError(`Table access check failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  function enableApiLogging() {
    if (!loggingEnabled) {
      // Override fetch to log all API calls
      const originalFetch = window.fetch
      window.fetch = async (...args) => {
        const url = args[0]
        const options = args[1] || {}

        console.log(`[API] ${options.method || "GET"} ${url}`, options)

        try {
          const response = await originalFetch(...args)

          // Clone the response to log it without consuming it
          const clone = response.clone()
          clone
            .text()
            .then((text) => {
              try {
                const data = JSON.parse(text)
                console.log(`[API] Response:`, data)
              } catch {
                console.log(`[API] Response: ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}`)
              }
            })
            .catch((err) => {
              console.log(`[API] Could not parse response: ${err.message}`)
            })

          return response
        } catch (err) {
          console.error(`[API] Error:`, err)
          throw err
        }
      }

      setLoggingEnabled(true)
      setSuccess("API logging enabled. Check the console for API calls.")
    } else {
      setError("Logging can only be enabled once per page load")
    }
  }

  async function testDemoLogin() {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await AuthService.signIn("demo@example.com", "demo123")

      if (result.success) {
        setSuccess(`Demo login successful! User: ${result.user?.email}`)
        setAuthStatus({
          isAuthenticated: true,
          demoUser: result.user,
          demoSession: result.session,
        })
      } else {
        setError(`Demo login failed: ${result.error}`)
      }
    } catch (err: any) {
      console.error("Demo login error:", err)
      setError(`Demo login error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Test your Supabase connection and authentication status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="tables">Table Access</TabsTrigger>
              <TabsTrigger value="tools">Debug Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={checkAuth} disabled={isLoading}>
                  {isLoading ? "Checking..." : "Check Authentication"}
                </Button>
                <Button onClick={testDemoLogin} disabled={isLoading} variant="outline">
                  Test Demo Login
                </Button>
              </div>

              {authStatus && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Authentication Status</h3>
                  <pre className="p-4 bg-muted rounded-md overflow-auto max-h-60">
                    {JSON.stringify(authStatus, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tables" className="space-y-4">
              <Button onClick={checkTableAccess} disabled={isLoading}>
                {isLoading ? "Checking..." : "Check Table Access"}
              </Button>

              {Object.keys(tableStatus).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Table Access Status</h3>
                  <div className="grid gap-4">
                    {tablesToCheck.map((table) => (
                      <div
                        key={table}
                        className={`p-4 rounded-md ${
                          tableStatus[table]?.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{table}</h4>
                          {tableStatus[table]?.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm mt-1">{tableStatus[table]?.message}</p>
                        {tableStatus[table]?.error && (
                          <p className="text-sm text-red-600 mt-1">{tableStatus[table].error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tools" className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={enableApiLogging} disabled={loggingEnabled}>
                  {loggingEnabled ? "Logging Enabled" : "Enable API Logging"}
                </Button>
                <Button onClick={() => (window.location.href = "/auth/test")} variant="outline">
                  Go to Auth Test Suite
                </Button>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
                <pre className="p-4 bg-muted rounded-md overflow-auto">
                  {`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Not Set"}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Not Set"}`}
                </pre>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Table Name Constants</h3>
                <pre className="p-4 bg-muted rounded-md overflow-auto">{JSON.stringify(TABLE_NAMES, null, 2)}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
