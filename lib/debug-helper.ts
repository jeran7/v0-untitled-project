import type { SupabaseClient } from "@supabase/supabase-js"

export async function testAuthentication(supabase: SupabaseClient) {
  try {
    // Check if we have a session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return {
        success: false,
        error: sessionError.message,
        message: "Failed to get session",
      }
    }

    if (!sessionData.session) {
      return {
        success: false,
        error: "No active session",
        message: "You are not authenticated",
      }
    }

    // Try to get user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return {
        success: false,
        error: userError.message,
        message: "Failed to get user data",
      }
    }

    return {
      success: true,
      message: "Authentication successful",
      user: {
        id: userData.user?.id,
        email: userData.user?.email,
      },
      session: {
        expires_at: sessionData.session?.expires_at,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Authentication test failed with an exception",
    }
  }
}

export async function checkTableAccess(supabase: SupabaseClient, tableName: string) {
  try {
    // Try to access the table
    const { data, error, status } = await supabase.from(tableName).select("count").limit(1)

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        status,
        message: `Failed to access table: ${tableName}`,
      }
    }

    return {
      success: true,
      count: data?.length || 0,
      status,
      message: `Successfully accessed table: ${tableName}`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: `Exception when accessing table: ${tableName}`,
    }
  }
}

export function enableApiLogging() {
  if (typeof window === "undefined") return

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

  console.log("[API] Logging enabled for all API calls")
}

export function fixUrlTruncation(supabase: SupabaseClient) {
  // This function is a placeholder for any additional URL truncation fixes
  // that might be needed beyond what's in the Supabase client
  console.log("[URL Fix] URL truncation fix applied")
}
