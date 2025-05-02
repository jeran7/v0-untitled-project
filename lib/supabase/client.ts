import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Table name constants to prevent truncation issues
export const TABLE_NAMES = {
  USER_SUBSCRIPTIONS: "user_subscriptions",
  SUBSCRIPTION_PLANS: "subscription_plans",
  USER_PROFILES: "user_profiles",
  TRADES: "trades",
  TRANSACTIONS: "transactions",
}

// Debug function that works even if console is broken
function debugLog(message: string, data?: any) {
  try {
    console.log(`[Supabase Client] ${message}`, data || "")
  } catch (e) {
    // Silent fallback if console is broken
  }
}

// Check if we have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  debugLog("⚠️ Missing Supabase environment variables!")
} else {
  debugLog(`✓ Supabase URL: ${supabaseUrl.substring(0, 20)}...`)
  debugLog(`✓ Supabase Anon Key: ${supabaseAnonKey.substring(0, 5)}...`)
}

// Create a custom storage handler with logging
const customStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined") {
        return null
      }
      const value = window.localStorage.getItem(key)
      debugLog(`Retrieved ${key}: ${value ? "✓" : "✗"}`)
      return value
    } catch (error) {
      debugLog(`Error getting ${key}:`, error)
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value)
        debugLog(`Set ${key}: ✓`)
      }
    } catch (error) {
      debugLog(`Error setting ${key}:`, error)
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
        debugLog(`Removed ${key}: ✓`)
      }
    } catch (error) {
      debugLog(`Error removing ${key}:`, error)
    }
  },
}

// Function to fix truncated table names in URLs
function fixTruncatedTableName(url: string): string {
  if (!url || typeof url !== "string") return url

  // Check if this is a request to a Supabase API endpoint
  if (url.includes("/rest/v1/")) {
    // Extract the table name from the URL
    const parts = url.split("/rest/v1/")
    if (parts.length > 1) {
      const tablePart = parts[1].split("?")[0]

      // Check for common truncated table names
      const knownTables: Record<string, string> = {
        user_sub: TABLE_NAMES.USER_SUBSCRIPTIONS,
        user_subscriptio: TABLE_NAMES.USER_SUBSCRIPTIONS,
        subscription_plan: TABLE_NAMES.SUBSCRIPTION_PLANS,
        user_prof: TABLE_NAMES.USER_PROFILES,
        user_profi: TABLE_NAMES.USER_PROFILES,
        user_profil: TABLE_NAMES.USER_PROFILES,
        user_profile: TABLE_NAMES.USER_PROFILES,
      }

      const fixedTableName = knownTables[tablePart] || tablePart

      if (fixedTableName !== tablePart) {
        // Replace the truncated table name with the fixed one
        const newUrl = url.replace(`/rest/v1/${tablePart}`, `/rest/v1/${fixedTableName}`)
        debugLog(`Fixed truncated URL: ${newUrl} (was: ${url})`)
        return newUrl
      }
    }
  }

  return url
}

// Create a singleton instance with robust error handling
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

try {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    debugLog("Creating Supabase client...")

    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "supabase.auth.token",
        storage: customStorage,
      },
      global: {
        headers: {
          "x-client-info": "trading-journal-app",
        },
        fetch: (...args: any[]) => {
          try {
            // Fix URL truncation issues
            if (typeof args[0] === "string") {
              args[0] = fixTruncatedTableName(args[0])
            } else if (args[0] && typeof args[0] === "object") {
              if (typeof args[0].url === "string") {
                args[0].url = fixTruncatedTableName(args[0].url)
              }
            }

            // Add debug headers to help track requests
            if (args[1] && typeof args[1] === "object") {
              if (!args[1].headers) args[1].headers = {}
              args[1].headers["x-debug-timestamp"] = Date.now().toString()
              args[1].headers["x-debug-client"] = "trading-journal-fixed"
            }

            // Log the request
            const url = typeof args[0] === "string" ? args[0] : args[0]?.url
            const method = args[1]?.method || "GET"
            debugLog(`${method} ${url}`)

            // Use the native fetch with the potentially modified arguments
            return fetch(...args)
              .then(async (response) => {
                // Log response status
                debugLog(`Response: ${response.status} ${response.statusText}`)

                // Log any 401 errors for debugging
                if (response.status === 401) {
                  debugLog("⚠️ 401 Unauthorized error:", {
                    url: args[0],
                    method: args[1]?.method || "GET",
                  })
                }

                return response
              })
              .catch((error) => {
                debugLog(`⚠️ Fetch error: ${error.message}`)
                throw error
              })
          } catch (error) {
            debugLog(`⚠️ Error in fetch wrapper: ${(error as Error).message}`)
            return fetch(...args) // Fallback to original fetch if our wrapper fails
          }
        },
      },
    })

    debugLog("Supabase client created successfully")
  }
} catch (error) {
  debugLog(`⚠️ Error creating Supabase client: ${(error as Error).message}`)
}

// Export the singleton instance with fallback
export const supabase =
  supabaseInstance ||
  createSupabaseClient<Database>(
    supabaseUrl || "https://placeholder-url.supabase.co",
    supabaseAnonKey || "placeholder-key",
    {
      auth: {
        persistSession: false, // Disable persistence for fallback client
      },
    },
  )

// Log initial session state
if (typeof window !== "undefined") {
  try {
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          debugLog(`⚠️ Initial session check error: ${error.message}`)
        } else {
          debugLog(`Initial session check: ${data.session ? "✓" : "✗"}`)
        }
      })
      .catch((err) => {
        debugLog(`⚠️ Exception in initial session check: ${err.message}`)
      })
  } catch (e) {
    debugLog(`⚠️ Failed to check initial session: ${(e as Error).message}`)
  }
}

// Re-export createClient for compatibility with existing code
export const createClient = createSupabaseClient
