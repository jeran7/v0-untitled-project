"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NavigationErrorRecovery() {
  const [hasError, setHasError] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  // Monitor for errors
  useEffect(() => {
    const originalConsoleError = console.error

    // Override console.error to detect React rendering errors
    console.error = (...args) => {
      // Call the original console.error
      originalConsoleError(...args)

      // Check if this is a React error
      const errorString = args.join(" ")
      if (
        errorString.includes("React") ||
        errorString.includes("Uncaught") ||
        errorString.includes("Error:") ||
        errorString.includes("TypeError:")
      ) {
        setHasError(true)
        setErrorCount((prev) => prev + 1)
      }
    }

    // Restore original on cleanup
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  // Reset error state when path changes
  useEffect(() => {
    setHasError(false)
  }, [pathname])

  // Auto-refresh if too many errors
  useEffect(() => {
    if (errorCount > 5) {
      // Too many errors, force refresh the page
      window.location.reload()
    }
  }, [errorCount])

  if (!hasError) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Navigation Error</AlertTitle>
        <AlertDescription className="mt-2">
          <p>There was a problem rendering this page.</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
