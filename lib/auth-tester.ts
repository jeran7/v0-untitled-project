import { supabase, TABLE_NAMES } from "./supabase/client"
import { AuthService } from "./auth-service"

export type TestResult = {
  name: string
  status: "success" | "error" | "warning" | "pending"
  message: string
  details?: any
  duration?: number
}

export type TestSuiteResults = {
  results: TestResult[]
  startTime: number
  endTime?: number
  overallStatus: "success" | "error" | "warning" | "pending"
}

export async function runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
  console.log(`Running test: ${name}`)
  const startTime = performance.now()

  try {
    const result = await testFn()
    const duration = performance.now() - startTime

    return {
      name,
      status: "success",
      message: "Test passed successfully",
      details: result,
      duration,
    }
  } catch (error: any) {
    const duration = performance.now() - startTime

    return {
      name,
      status: "error",
      message: error.message || "Test failed",
      details: error,
      duration,
    }
  }
}

export async function testAuthFlow(email: string, password: string): Promise<TestSuiteResults> {
  const results: TestResult[] = []
  const startTime = performance.now()

  // Test 1: Check Supabase client initialization
  results.push(
    await runTest("Supabase Client Initialization", async () => {
      if (!supabase) throw new Error("Supabase client is not initialized")
      return { initialized: true }
    }),
  )

  // Test 2: Check environment variables
  results.push(
    await runTest("Environment Variables", async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
      if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set")

      return {
        url: url.substring(0, 10) + "...",
        key: key.substring(0, 5) + "...",
      }
    }),
  )

  // Test 3: Sign out (to clear any existing session)
  results.push(
    await runTest("Sign Out", async () => {
      const result = await AuthService.signOut()
      if (!result.success) throw new Error(result.error || "Sign out failed")
      return result
    }),
  )

  // Test 4: Sign in
  results.push(
    await runTest("Sign In", async () => {
      const result = await AuthService.signIn(email, password)
      if (!result.success) throw new Error(result.error || "Sign in failed")
      return {
        success: result.success,
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
            }
          : null,
      }
    }),
  )

  // Test 5: Get session
  results.push(
    await runTest("Get Session", async () => {
      const session = await AuthService.getSession()
      if (!session) throw new Error("No session found after sign in")
      return {
        user: session.user
          ? {
              id: session.user.id,
              email: session.user.email,
            }
          : null,
        expiresAt: session.expires_at,
      }
    }),
  )

  // Test 6: Check authentication status
  results.push(
    await runTest("Check Authentication Status", async () => {
      const isAuthenticated = await AuthService.isAuthenticated()
      if (!isAuthenticated) throw new Error("Not authenticated after sign in")
      return { isAuthenticated }
    }),
  )

  // Test 7: Test table access - user_subscriptions
  results.push(
    await runTest("Access User Subscriptions Table", async () => {
      const { data, error } = await supabase.from(TABLE_NAMES.USER_SUBSCRIPTIONS).select("id").limit(1)

      if (error) throw error
      return { success: true, count: data?.length || 0 }
    }),
  )

  // Test 8: Test backup auth state
  results.push(
    await runTest("Backup Auth State", async () => {
      const backupAuth = AuthService.getBackupAuthState()
      if (!backupAuth) throw new Error("No backup auth state found")
      return { authenticated: backupAuth.authenticated, user: backupAuth.user }
    }),
  )

  // Calculate overall status
  const hasErrors = results.some((r) => r.status === "error")
  const hasWarnings = results.some((r) => r.status === "warning")

  let overallStatus: "success" | "error" | "warning" | "pending" = "success"
  if (hasErrors) overallStatus = "error"
  else if (hasWarnings) overallStatus = "warning"

  return {
    results,
    startTime,
    endTime: performance.now(),
    overallStatus,
  }
}
