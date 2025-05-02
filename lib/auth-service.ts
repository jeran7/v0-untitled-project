import { supabase } from "./supabase/client"

// Debug function that works even if console is broken
function debugLog(message: string, data?: any) {
  try {
    console.log(`[Auth Service] ${message}`, data || "")
  } catch (e) {
    // Silent fallback if console is broken
  }
}

// Simple service to handle authentication without complex state management
export const AuthService = {
  // Get current session
  getSession: async () => {
    try {
      debugLog("Getting session...")
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        debugLog("Error getting session:", error)
        throw error
      }

      debugLog("Session result:", { hasSession: !!data.session })
      return data.session
    } catch (error) {
      debugLog("Exception getting session:", error)
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      debugLog("Checking authentication...")
      const session = await AuthService.getSession()
      const result = !!session
      debugLog(`Authentication check result: ${result ? "Authenticated" : "Not authenticated"}`)
      return result
    } catch (error) {
      debugLog("Error checking authentication:", error)
      return false
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      debugLog(`Attempting to sign in with: ${email}`)

      // Development bypass for testing (remove in production)
      if (process.env.NODE_ENV === "development" && (email === "demo@example.com" || email.includes("demo"))) {
        debugLog("Using development bypass authentication")
        return {
          success: true,
          user: {
            id: "70adc632-3d46-4689-b462-54eee42c6c7e", // Use the ID we created a subscription for
            email: email,
            user_metadata: { name: "Demo User" },
          },
          session: {
            access_token: "dev-token",
            expires_at: Date.now() + 3600000,
          },
        }
      }

      // First sign out to clear any existing session
      debugLog("Signing out existing session...")
      await supabase.auth.signOut()

      debugLog("Attempting Supabase authentication...")

      // Sign in with new credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        debugLog("Supabase auth error:", error)
        throw error
      }

      debugLog("Authentication successful:", data.user?.email)

      // Store a backup of authentication state
      if (data.session) {
        try {
          localStorage.setItem(
            "auth-backup",
            JSON.stringify({
              authenticated: true,
              timestamp: Date.now(),
              user: data.user.email,
              userId: data.user.id,
            }),
          )
          debugLog("Stored auth backup")
        } catch (e) {
          debugLog("Could not store auth backup", e)
        }
      }

      return { success: true, user: data.user, session: data.session }
    } catch (error: any) {
      debugLog("Sign in error:", error)

      // Provide more specific error messages
      if (error.message?.includes("Invalid login credentials")) {
        return { success: false, error: "Invalid email or password. Please try again." }
      }

      // Handle network errors
      if (error.message?.includes("fetch") || error.message?.includes("network")) {
        return { success: false, error: "Network error. Please check your connection and try again." }
      }

      return { success: false, error: error.message || "Authentication failed" }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      debugLog("Signing out...")
      const { error } = await supabase.auth.signOut()

      if (error) {
        debugLog("Sign out error:", error)
        throw error
      }

      // Clear backup auth state
      try {
        localStorage.removeItem("auth-backup")
        debugLog("Cleared auth backup")
      } catch (e) {
        debugLog("Could not clear auth backup", e)
      }

      return { success: true }
    } catch (error: any) {
      debugLog("Sign out error:", error)
      return { success: false, error: error.message }
    }
  },

  // Get user profile from backup if session fails
  getBackupAuthState: () => {
    try {
      debugLog("Getting backup auth state...")
      const backup = localStorage.getItem("auth-backup")

      if (!backup) {
        debugLog("No backup auth found")
        return null
      }

      const data = JSON.parse(backup)

      // Check if backup is recent (less than 24 hours)
      const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000

      if (data.authenticated && isRecent) {
        debugLog("Found valid backup auth")
        return { authenticated: true, user: data.user, userId: data.userId }
      }

      debugLog("Backup auth expired or invalid")
      return null
    } catch (e) {
      debugLog("Could not get auth backup", e)
      return null
    }
  },
}
