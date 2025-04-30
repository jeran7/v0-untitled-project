import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Check if we have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
}

// Create a custom storage handler with logging
const customStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined") {
        return null
      }
      const value = window.localStorage.getItem(key)
      console.log(`[Storage] Retrieved ${key}: ${value ? "✓" : "✗"}`)
      return value
    } catch (error) {
      console.error(`[Storage] Error getting ${key}:`, error)
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value)
        console.log(`[Storage] Set ${key}: ✓`)
      }
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error)
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
        console.log(`[Storage] Removed ${key}: ✓`)
      }
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error)
    }
  },
}

// Create a single supabase client for the entire client-side application
export const supabase = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
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
  },
})

// Log initial session state
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    console.log(`[Supabase] Initial session check: ${data.session ? "✓" : "✗"}`)
  })
}

export { createClient }
