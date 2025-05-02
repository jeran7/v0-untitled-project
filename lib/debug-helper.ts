import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Test authentication status with Supabase
 */
export async function testAuthentication(supabase: SupabaseClient) {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return {
        authenticated: false,
        error: sessionError.message,
        session: null,
      }
    }

    // Check if we have a session
    if (!sessionData.session) {
      return {
        authenticated: false,
        error: "No active session",
        session: null,
      }
    }

    // Get user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return {
        authenticated: true,
        error: userError.message,
        session: sessionData.session,
        user: null,
      }
    }

    return {
      authenticated: true,
      error: null,
      session: sessionData.session,
      user: userData.user,
    }
  } catch (error) {
    return {
      authenticated: false,
      error: (error as Error).message,
      session: null,
    }
  }
}

/**
 * Check if we can access a specific table
 */
export async function checkTableAccess(supabase: SupabaseClient, tableName: string) {
  try {
    // Ensure the full table name is used (no truncation)
    const fullTableName = tableName.trim()

    console.log(`Testing access to table: ${fullTableName}`)

    // First try a HEAD request to check if the table exists
    const { error: headError } = await supabase.from(fullTableName).select("*", { head: true, count: "exact" }).limit(1)

    if (headError) {
      return {
        accessible: false,
        error: headError.message,
        details: headError,
      }
    }

    // If HEAD request succeeded, try a small SELECT
    const { data, error, count } = await supabase.from(fullTableName).select("*", { count: "exact" }).limit(1)

    if (error) {
      return {
        accessible: false,
        error: error.message,
        details: error,
      }
    }

    return {
      accessible: true,
      error: null,
      count,
      sample: data,
    }
  } catch (error) {
    return {
      accessible: false,
      error: (error as Error).message,
    }
  }
}

/**
 * Enable detailed API request logging
 */
export function enableApiLogging() {
  if (typeof window !== "undefined") {
    // Monkey patch fetch to log all requests
    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.url
      const method = init?.method || (typeof input !== "string" && input.method) || "GET"

      console.group(`🌐 Fetch: ${method} ${url}`)
      console.log("Request:", { url, method, headers: init?.headers })

      try {
        const response = await originalFetch(input, init)

        // Clone the response so we can log it and still return it
        const clone = response.clone()

        // Log response details
        console.log("Response:", {
          status: clone.status,
          statusText: clone.statusText,
          headers: Object.fromEntries(clone.headers.entries()),
        })

        // Try to log the body if it's JSON
        try {
          const contentType = clone.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const body = await clone.json()
            console.log("Response body:", body)
          }
        } catch (e) {
          console.log("Could not parse response body")
        }

        console.groupEnd()
        return response
      } catch (error) {
        console.error("Fetch error:", error)
        console.groupEnd()
        throw error
      }
    }

    console.log("API request logging enabled")
  }
}

/**
 * Fix URL truncation issues in Supabase requests
 */
export function fixUrlTruncation(supabaseClient: SupabaseClient) {
  // This is a workaround for URL truncation issues
  // It monkey patches the Supabase client's internal fetch function

  try {
    // @ts-ignore - Accessing internal properties
    const originalFetch = supabaseClient.rest.fetchWithAuth

    if (originalFetch) {
      // @ts-ignore - Patching internal method
      supabaseClient.rest.fetchWithAuth = async function (url: string, options: any) {
        // Check if the URL might be truncated
        if (url.includes("/rest/v1/")) {
          // Extract the table name from the URL
          const parts = url.split("/rest/v1/")
          if (parts.length > 1) {
            const tablePart = parts[1].split("?")[0]

            // Check for common truncated table names
            const fixedTableName = fixTableName(tablePart)

            if (fixedTableName !== tablePart) {
              // Replace the truncated table name with the fixed one
              url = url.replace(`/rest/v1/${tablePart}`, `/rest/v1/${fixedTableName}`)
              console.log(`Fixed truncated URL: ${url}`)
            }
          }
        }

        return originalFetch.call(this, url, options)
      }

      console.log("URL truncation fix applied to Supabase client")
    }
  } catch (error) {
    console.error("Could not apply URL truncation fix:", error)
  }
}

/**
 * Fix common truncated table names
 */
function fixTableName(tableName: string): string {
  const knownTables: Record<string, string> = {
    user_sub: "user_subscriptions",
    user_subscriptio: "user_subscriptions",
    subscription_plan: "subscription_plans",
    user_prof: "user_profiles",
    user_profi: "user_profiles",
    user_profil: "user_profiles",
    user_profile: "user_profiles",
  }

  return knownTables[tableName] || tableName
}
