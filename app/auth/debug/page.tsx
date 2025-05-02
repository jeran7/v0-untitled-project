"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { checkTableAccess, testAuthentication, enableApiLogging } from "@/lib/debug-helper"
import { AuthService } from "@/lib/auth-service"

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [tableStatus, setTableStatus] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loggingEnabled, setLoggingEnabled] = useState(false)

  // Tables to check
  const tablesToCheck = ["user_subscriptions", "subscription_plans", "user_profiles", "trades"]

  async function runTests() {
    setIsLoading(true)

    // Test authentication
    const authResult = await testAuthentication(supabase)
    setAuthStatus(authResult)

    // Test table access
    const tableResults: Record<string, any> = {}
    for (const table of tablesToCheck) {
      tableResults[table] = await checkTableAccess(supabase, table)
    }
    setTableStatus(tableResults)

    setIsLoading(false)
  }

  function toggleApiLogging() {
    if (!loggingEnabled) {
      enableApiLogging()
      setLoggingEnabled(true)
    } else {
      alert("Logging can only be enabled once per page load")
    }
  }

  async function testDemoLogin() {
    setIsLoading(true)
    try {
      const result = await AuthService.signIn("demo@example.com", "demo123")
      alert(JSON.stringify(result, null, 2))
    } catch (err) {
      console.error("Demo login error:", err)
      alert("Error: " + (err as any).message)
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
          <div className="flex gap-4">
            <Button onClick={runTests} disabled={isLoading}>
              {isLoading ? "Running Tests..." : "Run Tests"}
            </Button>
            <Button onClick={toggleApiLogging} disabled={loggingEnabled} variant="outline">
              {loggingEnabled ? "Logging Enabled" : "Enable API Logging"}
            </Button>
            <Button onClick={testDemoLogin} disabled={isLoading} variant="secondary">
              Test Demo Login
            </Button>
          </div>

          {authStatus && (
            <div className="mt-6">
              <h3 className="text-lg font-medium">Authentication Status</h3>
              <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto max-h-40">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            </div>
          )}

          {Object.keys(tableStatus).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium">Table Access Status</h3>
              <div className="grid gap-4 mt-2">
                {tablesToCheck.map((table) => (
                  <div key={table} className="p-4 bg-muted rounded-md">
                    <h4 className="font-medium">{table}</h4>
                    <pre className="mt-2 overflow-auto max-h-40">{JSON.stringify(tableStatus[table], null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium">Environment Variables</h3>
            <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto max-h-40">
              {`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Not Set"}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Not Set"}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
