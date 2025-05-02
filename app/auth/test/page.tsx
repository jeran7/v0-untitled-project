"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, AlertTriangle } from "lucide-react"
import { testAuthFlow, type TestSuiteResults, type TestResult } from "@/lib/auth-tester"

export default function AuthTestPage() {
  const [email, setEmail] = useState("j3@j.com")
  const [password, setPassword] = useState("123456")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<TestSuiteResults | null>(null)

  async function runTests() {
    setIsLoading(true)
    try {
      const testResults = await testAuthFlow(email, password)
      setResults(testResults)
    } catch (error) {
      console.error("Test suite error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function getStatusIcon(status: TestResult["status"]) {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

  function getStatusColor(status: TestResult["status"]) {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-amber-50 border-amber-200"
      case "pending":
        return "bg-blue-50 border-blue-200"
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Flow Test</CardTitle>
          <CardDescription>Test the complete authentication flow with the fixed Supabase client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-2">
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

          <Button onClick={runTests} disabled={isLoading} className="w-full">
            {isLoading ? "Running Tests..." : "Run Authentication Tests"}
          </Button>

          {results && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Test Results</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Duration: {((results.endTime || 0) - results.startTime).toFixed(0)}ms
                  </span>
                  {getStatusIcon(results.overallStatus)}
                </div>
              </div>

              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-md border ${getStatusColor(result.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <h4 className="font-medium">{result.name}</h4>
                      </div>
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">{result.duration.toFixed(0)}ms</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{result.message}</p>
                    {result.details && (
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              {results.overallStatus === "success" ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>All authentication tests passed successfully!</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Some tests failed. Please check the results above.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/auth/debug")}>
            Go to Auth Debug
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
