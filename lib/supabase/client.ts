import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Constants for table names to avoid truncation issues
export const TABLE_NAMES = {
  USER_PROFILES: "user_profiles",
  USER_SETTINGS: "user_settings",
  TRADES: "trades",
  TRADE_IMAGES: "trade_images",
  TRADE_NOTES: "trade_notes",
  STRATEGIES: "strategies",
  STRATEGY_RULES: "strategy_rules",
  TRADE_STRATEGIES: "trade_strategies",
  TRADE_RULE_COMPLIANCE: "trade_rule_compliance",
  TRADE_AI_INSIGHTS: "trade_ai_insights",
  USER_SUBSCRIPTIONS: "user_subscriptions",
  SUBSCRIPTION_PLANS: "subscription_plans",
  USAGE_TRACKING: "usage_tracking",
  PAYMENT_HISTORY: "payment_history",
  MISTAKES: "mistakes",
}

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

function initSupabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      throw new Error("Missing Supabase environment variables")
    }

    console.log("Initializing Supabase client")
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "supabase-auth",
      },
      global: {
        headers: {
          "x-client-info": "trading-journal-app",
        },
        fetch: (...args: any[]) => {
          // Get the URL from the arguments
          const url = typeof args[0] === "string" ? args[0] : args[0].url

          // Check if this is a request to a Supabase API endpoint
          if (url && typeof url === "string" && url.includes("/rest/v1/")) {
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
                console.log(`Fixed truncated URL: ${newUrl} (was: ${url})`)

                // Update the URL in the arguments
                if (typeof args[0] === "string") {
                  args[0] = newUrl
                } else {
                  args[0].url = newUrl
                }
              }
            }
          }

          // Use the native fetch with the potentially modified arguments
          return fetch(...args).then(async (response) => {
            // Log any 401 errors for debugging
            if (response.status === 401) {
              console.error("401 Unauthorized error:", {
                url: args[0],
                method: args[1]?.method || "GET",
              })
            }
            return response
          })
        },
      },
    })
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    throw error
  }
}

// Initialize the singleton instance
if (!supabaseInstance) {
  try {
    supabaseInstance = initSupabase()
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error)
  }
}

// Export the singleton instance
export const supabase =
  supabaseInstance ||
  createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      auth: {
        persistSession: false, // Disable persistence for fallback client
      },
    },
  )

// Log initial session state
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    console.log(`[Supabase] Initial session check: ${data.session ? "✓" : "✗"}`)
  })
}

// Re-export createClient for compatibility with existing code
export const createClient = createSupabaseClient
