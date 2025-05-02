"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { AuthService } from "@/lib/auth-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Debug console that works even when console is broken
const DebugConsole = {
  log: (message: string, data?: any) => {
    try {
      console.log(`[DEBUG] ${message}`, data)
    } catch (e) {
      // Silent fallback if console is broken
    }

    // Also add to debug log element if it exists
    try {
      const debugLog = document.getElementById("debug-log")
      if (debugLog) {
        const entry = document.createElement("div")
        entry.className = "text-xs border-b border-gray-200 py-1"
        entry.textContent = `${new Date().toISOString().split("T")[1].split(".")[0]} - ${message}`
        debugLog.prepend(entry)

        // Trim log if it gets too long
        if (debugLog.children.length > 50) {
          debugLog.removeChild(debugLog.lastChild)
        }
      }
    } catch (e) {
      // Silent fallback
    }
  },

  error: (message: string, error?: any) => {
    try {
      console.error(`[DEBUG ERROR] ${message}`, error)
    } catch (e) {
      // Silent fallback
    }

    // Also add to debug log element if it exists
    try {
      const debugLog = document.getElementById("debug-log")
      if (debugLog) {
        const entry = document.createElement("div")
        entry.className = "text-xs border-b border-red-200 py-1 text-red-600"
        entry.textContent = `${new Date().toISOString().split("T")[1].split(".")[0]} - ERROR: ${message} ${error ? `- ${error.message || JSON.stringify(error)}` : ""}`
        debugLog.prepend(entry)
      }
    } catch (e) {
      // Silent fallback
    }
  },
}

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [tableStatus, setTableStatus] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loggingEnabled, setLoggingEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState("auth")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState("demo@example.com")
  const [password, setPassword] = useState("demo123")
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [directSupabaseTest, setDirectSupabaseTest] = useState<any>(null)

  // Tables to check
  const tablesToCheck = ["user_subscriptions", "subscription_plans", "user_profiles", "trades"]

  // Initialize with some basic checks
  useEffect(() => {
    // Check if Supabase is defined
    if (!supabase) {
      DebugConsole.error("Supabase client is not defined!")
      setError("Supabase client is not defined. Check your initialization.")
      return
    }

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      DebugConsole.error("Supabase environment variables are missing!")
      setError("Supabase environment variables are missing. Check your .env file.")
      return
    }

    DebugConsole.log("Auth debug page initialized")
    DebugConsole.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15)}...`)

    // Add unhandled error handler
    const errorHandler = (event: ErrorEvent) => {
      DebugConsole.error("Unhandled error:", event.error)
      setError(`Unhandled error: ${event.message}`)
    }

    window.addEventListener("error", errorHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    DebugConsole.log("Starting auth check...")
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Direct test of Supabase auth
      DebugConsole.log("Testing direct Supabase auth...")
      let directAuthResult

      try {
        const { data, error } = await supabase.auth.getSession()
        directAuthResult = { data, error }
        DebugConsole.log("Direct auth result:", directAuthResult)
      } catch (err) {
        DebugConsole.error("Direct auth test failed with exception:", err)
        directAuthResult = { error: err }
      }

      setDirectSupabaseTest(directAuthResult)

      // Check if user is authenticated via our service
      DebugConsole.log("Checking auth via AuthService...")
      const session = await AuthService.getSession()
      const isAuthenticated = !!session
      DebugConsole.log("Auth service result:", { isAuthenticated, session: !!session })

      // Get backup auth state
      const backupAuth = AuthService.getBackupAuthState()
      DebugConsole.log("Backup auth state:", backupAuth)

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
        directTest: directAuthResult,
      })

      if (isAuthenticated) {
        setSuccess("Authentication check successful. You are authenticated.")
      } else if (backupAuth?.authenticated) {
        setSuccess("No active session found, but backup authentication is available.")
      } else {
        setError("You are not authenticated. Please sign in.")
      }
    } catch (err: any) {
      DebugConsole.error("Auth check error:", err)
      setError(`Authentication check failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkTableAccess = useCallback(async () => {
    DebugConsole.log("Starting table access check...")
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const results: Record<string, any> = {}
      let accessCount = 0

      for (const table of tablesToCheck) {
        try {
          DebugConsole.log(`Testing access to table: ${table}...`)
          const startTime = Date.now()

          const { data, error, status } = await supabase.from(table).select("count").limit(1)

          const duration = Date.now() - startTime
          DebugConsole.log(`Table ${table} response in ${duration}ms:`, { data, error, status })

          if (error) {
            DebugConsole.error(`Error accessing table ${table}:`, error)
            results[table] = {
              success: false,
              error: error.message,
              code: error.code,
              status,
              message: `Access failed (${duration}ms)`,
            }
          } else {
            results[table] = {
              success: true,
              count: data?.length || 0,
              status,
              message: `Access successful (${duration}ms)`,
            }
            accessCount++
          }
        } catch (err: any) {
          DebugConsole.error(`Exception accessing table ${table}:`, err)
          results[table] = {
            success: false,
            error: err.message,
            message: "Access failed with exception",
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
      DebugConsole.error("Table access check error:", err)
      setError(`Table access check failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [tablesToCheck])

  const enableApiLogging = useCallback(() => {
    if (!loggingEnabled) {
      try {
        DebugConsole.log("Enabling API logging...")

        // Override fetch to log all API calls
        const originalFetch = window.fetch
        window.fetch = async (...args) => {
          const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].toString() : args[0].url
          const options = args[1] || {}

          const logPrefix = `[API] ${options.method || "GET"} ${typeof url === "string" ? url : "(URL object)"}`
          DebugConsole.log(logPrefix, { headers: options.headers })

          try {
            const response = await originalFetch(...args)

            // Clone the response to log it without consuming it
            const clone = response.clone()

            DebugConsole.log(`${logPrefix} Response: ${response.status} ${response.statusText}`)

            // Try to log response body for JSON responses
            if (clone.headers.get("content-type")?.includes("application/json")) {
              try {
                const json = await clone.json()
                DebugConsole.log(`${logPrefix} Body:`, json)
              } catch (e) {
                DebugConsole.error(`${logPrefix} Could not parse JSON response:`, e)
              }
            }

            return response
          } catch (err) {
            DebugConsole.error(`${logPrefix} Error:`, err)
            throw err
          }
        }

        setLoggingEnabled(true)
        setSuccess("API logging enabled. Check the console and debug log for API calls.")
      } catch (err) {
        DebugConsole.error("Error enabling API logging:", err)
        setError(`Could not enable API logging: ${(err as Error).message}`)
      }
    } else {
      setError("Logging can only be enabled once per page load")
    }
  }, [loggingEnabled])

  const testDemoLogin = useCallback(async () => {
    DebugConsole.log(`Starting demo login test with email: ${email}...`)
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // First try direct Supabase auth
      DebugConsole.log("Testing direct Supabase auth...")
      let directAuthResult

      try {
        // First sign out to clear any existing session
        await supabase.auth.signOut()
        DebugConsole.log("Signed out existing session")

        // Try direct sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        directAuthResult = { data, error }
        DebugConsole.log("Direct auth result:", directAuthResult)
      } catch (err) {
        DebugConsole.error("Direct auth test failed with exception:", err)
        directAuthResult = { error: err }
      }

      // Now try with our auth service
      DebugConsole.log("Testing login via AuthService...")
      const result = await AuthService.signIn(email, password)
      DebugConsole.log("Auth service login result:", result)

      if (result.success) {
        setSuccess(`Demo login successful! User: ${result.user?.email}`)
        setAuthStatus({
          isAuthenticated: true,
          demoUser: result.user,
          demoSession: result.session,
          directTest: directAuthResult,
        })
      } else {
        setError(`Demo login failed: ${result.error}`)
      }
    } catch (err: any) {
      DebugConsole.error("Demo login error:", err)
      setError(`Demo login error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [email, password])

  const testDirectSupabase = useCallback(async () => {
    DebugConsole.log("Testing direct Supabase connection...")
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Test if we can connect to Supabase at all
      const startTime = Date.now()

      // Try a simple query that should work even without auth
      const { data, error } = await supabase.from("subscription_plans").select("count").limit(1).throwOnError()

      const duration = Date.now() - startTime

      if (error) {
        DebugConsole.error(`Supabase connection test failed in ${duration}ms:`, error)
        setError(`Supabase connection failed: ${error.message} (${error.code})`)
      } else {
        DebugConsole.log(`Supabase connection test succeeded in ${duration}ms:`, data)
        setSuccess(`Successfully connected to Supabase in ${duration}ms!`)
      }
    } catch (err: any) {
      DebugConsole.error("Supabase connection test exception:", err)
      setError(`Supabase connection exception: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

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

          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={testDirectSupabase}
              disabled={isLoading}
              variant="secondary"
              className="bg-purple-100 hover:bg-purple-200 text-purple-800"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Supabase Connection
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="tables">Table Access</TabsTrigger>
              <TabsTrigger value="tools">Debug Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={checkAuth} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Check Authentication
                </Button>

                <Button onClick={testDemoLogin} disabled={isLoading} variant="outline">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Test Demo Login
                </Button>
              </div>

              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {authStatus && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Authentication Status</h3>
                  <pre className="p-4 bg-muted rounded-md overflow-auto max-h-60 text-xs">
                    {JSON.stringify(authStatus, null, 2)}
                  </pre>
                </div>
              )}

              {directSupabaseTest && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Direct Supabase Auth Test</h3>
                  <pre className="p-4 bg-muted rounded-md overflow-auto max-h-60 text-xs">
                    {JSON.stringify(directSupabaseTest, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tables" className="space-y-4">
              <Button onClick={checkTableAccess} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Table Access
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
              <div className="flex flex-wrap gap-4">
                <Button onClick={enableApiLogging} disabled={loggingEnabled}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loggingEnabled ? "Logging Enabled" : "Enable API Logging"}
                </Button>

                <Button
                  onClick={() => {
                    localStorage.clear()
                    sessionStorage.clear()
                    setSuccess("Storage cleared!")
                  }}
                  variant="destructive"
                >
                  Clear All Storage
                </Button>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
                <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                  {`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Not Set"}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Not Set"}`}
                </pre>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Debug Log</h3>
                <div id="debug-log" className="p-4 bg-muted rounded-md overflow-auto max-h-60 text-xs space-y-1">
                  <div className="text-xs py-1">Debug log will appear here...</div>
                </div>
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
